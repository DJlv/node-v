function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function groupNodesByOrder(nodes) {
  const groups = new Map();
  for (const node of nodes) {
    const order = node.order ?? Number.MAX_SAFE_INTEGER;
    if (!groups.has(order)) groups.set(order, []);
    groups.get(order).push(node);
  }
  return [...groups.entries()].sort(([a], [b]) => a - b);
}

function sortGroupNodes(groupNodes, edges, previousGroupNodeIds) {
  if (!previousGroupNodeIds?.length || groupNodes.length <= 1) {
    return [...groupNodes].sort((a, b) =>
      String(a.id).localeCompare(String(b.id), "zh-CN", { numeric: true }),
    );
  }

  const prevRank = new Map(previousGroupNodeIds.map((id, index) => [id, index]));

  function predecessorRank(nodeId) {
    const ranks = edges
      .filter((edge) => edge.to === nodeId)
      .map((edge) => prevRank.get(edge.from))
      .filter((rank) => rank != null);
    if (!ranks.length) return Number.MAX_SAFE_INTEGER;
    return Math.min(...ranks);
  }

  return [...groupNodes].sort((a, b) => {
    const diff = predecessorRank(a.id) - predecessorRank(b.id);
    if (diff !== 0) return diff;
    return String(a.id).localeCompare(String(b.id), "zh-CN", { numeric: true });
  });
}

function buildGraph(nodes, edges) {
  const children = new Map();
  const parents = new Map();

  for (const node of nodes) {
    children.set(node.id, []);
    parents.set(node.id, []);
  }

  for (const edge of edges) {
    if (!children.has(edge.from) || !parents.has(edge.to)) continue;
    children.get(edge.from).push(edge.to);
    parents.get(edge.to).push(edge.from);
  }

  return { children, parents };
}

function findRoots(nodes, parents) {
  const roots = nodes.filter((node) => !(parents.get(node.id) || []).length);
  if (roots.length) {
    return roots.sort((a, b) => {
      const ao = a.order ?? Number.MAX_SAFE_INTEGER;
      const bo = b.order ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return String(a.id).localeCompare(String(b.id), "zh-CN", { numeric: true });
    });
  }
  return [nodes[0]];
}

function findEndNode(nodes, children) {
  const terminals = nodes.filter((node) => !(children.get(node.id) || []).length);
  if (!terminals.length) return null;
  return terminals.sort((a, b) => {
    const ao = a.order ?? Number.MIN_SAFE_INTEGER;
    const bo = b.order ?? Number.MIN_SAFE_INTEGER;
    if (ao !== bo) return bo - ao;
    return String(b.id).localeCompare(String(a.id), "zh-CN", { numeric: true });
  })[0];
}

function nodeCenterY(node) {
  return node.y + node.height / 2;
}

function isChainBlock(placed, parents) {
  return placed.every((node) => (parents.get(node.id) || []).length === 1);
}

function alignNodesInColumn(columnNodes, placedById, parents, children, spineY, gapY, defaultHeight, padding) {
  const autoNodes = columnNodes.filter((node) => node.y == null);
  if (!autoNodes.length) return [];

  const groups = new Map();
  for (const node of autoNodes) {
    const key = (parents.get(node.id) || []).slice().sort().join("|") || "_root_";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(node);
  }

  const blocks = [];
  for (const groupNodes of groups.values()) {
    const preds = parents.get(groupNodes[0].id) || [];
    let anchorCenter = spineY;

    if (preds.length === 1) {
      const pred = placedById.get(preds[0]);
      if (pred) anchorCenter = nodeCenterY(pred);
    } else if (preds.length > 1) {
      const centers = preds
        .map((id) => placedById.get(id))
        .filter(Boolean)
        .map(nodeCenterY);
      if (centers.length) {
        anchorCenter = centers.reduce((sum, value) => sum + value, 0) / centers.length;
      }
    }

    const sorted = [...groupNodes].sort((a, b) =>
      String(a.id).localeCompare(String(b.id), "zh-CN", { numeric: true }),
    );

    if (sorted.length === 1 && preds.length === 1) {
      const predId = preds[0];
      const predChildren = children.get(predId) || [];
      if (predChildren.length === 1) {
        const node = sorted[0];
        const height = node.height ?? defaultHeight;
        blocks.push({
          anchorCenter,
          preds,
          placed: [{ ...node, y: anchorCenter - height / 2, height }],
        });
        continue;
      }
    }

    const totalHeight = sorted.reduce(
      (sum, node, index) => sum + (node.height ?? defaultHeight) + (index ? gapY : 0),
      0,
    );

    let y = anchorCenter - totalHeight / 2;
    const placed = sorted.map((node) => {
      const height = node.height ?? defaultHeight;
      const item = { ...node, y, height };
      y += height + gapY;
      return item;
    });
    blocks.push({ anchorCenter, placed, preds });
  }

  blocks.sort((a, b) => a.anchorCenter - b.anchorCenter);
  for (let index = 1; index < blocks.length; index += 1) {
    const prev = blocks[index - 1].placed.at(-1);
    const cur = blocks[index].placed[0];
    const minY = prev.y + prev.height + gapY;
    if (cur.y < minY) {
      const delta = minY - cur.y;
      if (isChainBlock(blocks[index].placed, parents)) {
        for (const node of blocks[index - 1].placed) {
          node.y -= delta;
        }
        const top = blocks[index - 1].placed[0].y;
        if (top < padding) {
          const fix = padding - top;
          for (const node of blocks[index - 1].placed) node.y += fix;
          for (const node of blocks[index].placed) node.y += fix;
        }
      } else {
        for (const node of blocks[index].placed) {
          node.y += delta;
        }
      }
    }
  }

  return blocks.flatMap((block) => block.placed);
}

function alignSinglePredecessorChains(placedById, parents, children, nodeById) {
  const ids = [...placedById.keys()];
  for (let pass = 0; pass < ids.length; pass += 1) {
    for (const id of ids) {
      if (nodeById.get(id)?.y != null) continue;
      const preds = parents.get(id) || [];
      if (preds.length !== 1) continue;
      const predId = preds[0];
      if ((children.get(predId) || []).length > 1) continue;
      const placed = placedById.get(id);
      const pred = placedById.get(predId);
      if (!placed || !pred) continue;
      placedById.set(id, { ...placed, y: nodeCenterY(pred) - placed.height / 2 });
    }
  }
}

function collectLinearBranch(fromId, parents, children) {
  const ids = new Set([fromId]);
  let current = fromId;
  while (true) {
    const kids = children.get(current) || [];
    if (kids.length !== 1) break;
    const child = kids[0];
    const preds = parents.get(child) || [];
    if (preds.length !== 1 || preds[0] !== current) break;
    ids.add(child);
    current = child;
  }
  return ids;
}

function collectBranchGroups(parents, children, placedById) {
  const groups = [];
  const seen = new Set();
  for (const id of placedById.keys()) {
    const kids = children.get(id) || [];
    if (kids.length <= 1) continue;
    for (const kid of kids) {
      const branch = collectLinearBranch(kid, parents, children);
      const key = [...branch].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      groups.push(branch);
    }
  }
  return groups;
}

function shiftBranch(placedById, branchIds, delta) {
  for (const id of branchIds) {
    const node = placedById.get(id);
    if (node) placedById.set(id, { ...node, y: node.y + delta });
  }
}

function resolveColumnOverlaps(placedById, gapY, branchGroups) {
  const columns = new Map();
  for (const node of placedById.values()) {
    const key = Math.round(node.x);
    if (!columns.has(key)) columns.set(key, []);
    columns.get(key).push(node);
  }

  for (const column of columns.values()) {
    column.sort((a, b) => a.y - b.y);
    for (let index = 1; index < column.length; index += 1) {
      const prev = column[index - 1];
      let cur = placedById.get(column[index].id);
      const minY = prev.y + prev.height + gapY;
      if (cur.y >= minY) continue;

      const delta = minY - cur.y;
      const branch = branchGroups.find((group) => group.has(cur.id));
      if (branch) {
        shiftBranch(placedById, branch, delta);
      } else {
        cur = { ...cur, y: cur.y + delta };
        placedById.set(cur.id, cur);
      }
      column[index] = placedById.get(column[index].id);
    }
  }
}

function centerContentOnStart(placedById, startId) {
  const start = startId ? placedById.get(startId) : null;
  if (!start) return;

  const nodes = [...placedById.values()];
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxY = Math.max(...nodes.map((node) => node.y + node.height));
  const delta = (minY + maxY) / 2 - nodeCenterY(start);
  if (Math.abs(delta) < 0.5) return;

  for (const [id, node] of placedById) {
    placedById.set(id, { ...node, y: node.y + delta });
  }
}

function snapSpineNodes(placedById, startId, endId) {
  const start = startId ? placedById.get(startId) : null;
  const end = endId ? placedById.get(endId) : null;
  if (!start || !end) return;

  const top = nodeCenterY(start) - start.height / 2;
  placedById.set(start.id, { ...start, y: top });
  placedById.set(end.id, { ...end, y: top });
}

function layoutColumnFlow(nodes, edges) {
  const padding = 32;
  const defaultWidth = 128;
  const defaultHeight = 44;
  const gapX = 72;
  const gapY = 28;

  const groups = groupNodesByOrder(nodes);
  let previousGroupNodeIds = [];
  const columns = [];

  for (const [, groupNodes] of groups) {
    const sortedGroup = sortGroupNodes(groupNodes, edges || [], previousGroupNodeIds);
    const columnHeight = sortedGroup.reduce((sum, node, index) => {
      const height = node.height ?? defaultHeight;
      return sum + height + (index ? gapY : 0);
    }, 0);
    columns.push({ sortedGroup, columnHeight });
    previousGroupNodeIds = sortedGroup.map((node) => node.id);
  }

  const maxColumnHeight = Math.max(...columns.map((column) => column.columnHeight), defaultHeight);
  const spineY = padding + maxColumnHeight / 2;
  const { parents, children } = buildGraph(nodes, edges);
  const start = findRoots(nodes, parents)[0];
  const endNodeDef = findEndNode(nodes, children);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const placedById = new Map();
  let mainCursor = padding;

  for (const { sortedGroup } of columns) {
    const columnNodes = sortedGroup.map((node) => {
      const width = node.width ?? defaultWidth;
      const height = node.height ?? defaultHeight;
      return {
        ...node,
        x: node.x ?? mainCursor,
        y: nodeById.get(node.id)?.y ?? null,
        width,
        height,
      };
    });

    const aligned = alignNodesInColumn(
      columnNodes,
      placedById,
      parents,
      children,
      spineY,
      gapY,
      defaultHeight,
      padding,
    );

    for (const node of columnNodes) {
      const manualY = nodeById.get(node.id)?.y;
      const alignedNode = aligned.find((item) => item.id === node.id);
      const y = manualY ?? alignedNode?.y ?? spineY - node.height / 2;
      placedById.set(node.id, { ...node, y });
    }

    const maxWidth = Math.max(...sortedGroup.map((item) => item.width ?? defaultWidth), defaultWidth);
    mainCursor += maxWidth + gapX;
  }

  alignSinglePredecessorChains(placedById, parents, children, nodeById);
  const branchGroups = collectBranchGroups(parents, children, placedById);
  resolveColumnOverlaps(placedById, gapY, branchGroups);
  alignSinglePredecessorChains(placedById, parents, children, nodeById);
  snapSpineNodes(placedById, start?.id, endNodeDef?.id);
  centerContentOnStart(placedById, start?.id);
  return nodes.map((node) => placedById.get(node.id)).filter(Boolean);
}

function layoutNodes(nodes, edges, direction) {
  if (direction !== "vertical") {
    return layoutColumnFlow(nodes, edges);
  }

  const padding = 32;
  const defaultWidth = 128;
  const defaultHeight = 44;
  const gapMain = 72;
  const gapCross = 28;

  const groups = groupNodesByOrder(nodes);
  const placed = [];
  let mainCursor = padding;
  let previousGroupNodeIds = [];

  for (const [, groupNodes] of groups) {
    const sortedGroup = sortGroupNodes(groupNodes, edges || [], previousGroupNodeIds);

    const mainSizes = sortedGroup.map((node) => node.height ?? defaultHeight);
    const maxMainInGroup = Math.max(...mainSizes, defaultHeight);

    sortedGroup.forEach((node, index) => {
      const width = node.width ?? defaultWidth;
      const height = node.height ?? defaultHeight;
      let x = node.x;
      let y = node.y;

      if (x == null || y == null) {
        x =
          padding +
          sortedGroup
            .slice(0, index)
            .reduce((sum, item) => sum + (item.width ?? defaultWidth) + gapCross, 0);
        y = mainCursor;
      }

      placed.push({ ...node, x, y, width, height });
    });

    previousGroupNodeIds = sortedGroup.map((node) => node.id);
    mainCursor += maxMainInGroup + gapMain;
  }

  return placed;
}

function nodeMap(nodes) {
  return new Map(nodes.map((node) => [node.id, node]));
}

function anchorPoint(node, side) {
  const x = node.x;
  const y = node.y;
  const w = node.width;
  const h = node.height;
  switch (side) {
    case "left":
      return { x, y: y + h / 2 };
    case "right":
      return { x: x + w, y: y + h / 2 };
    case "top":
      return { x: x + w / 2, y };
    case "bottom":
      return { x: x + w / 2, y: y + h };
    default:
      return { x: x + w / 2, y: y + h / 2 };
  }
}

function renderNode(node) {
  const { id, x, y, width, height, fill, stroke, label, shape, textColor } = node;
  const textX = x + width / 2;
  const textY = y + height / 2 + 5;
  const rx = shape === "rounded" ? 8 : 0;
  const labelFill = escapeXml(textColor || "#213547");

  return `
    <g data-node-id="${escapeXml(id)}">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}"
        fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="1.5" />
      <text x="${textX}" y="${textY}" text-anchor="middle" font-size="14"
        fill="${labelFill}">${escapeXml(label)}</text>
    </g>
  `;
}

function assignEdgeChannels(edges, nodesById, direction) {
  const horizontal = direction !== "vertical";
  const channels = new Map();
  const groups = new Map();

  for (const edge of edges) {
    const fromNode = nodesById.get(edge.from);
    const toNode = nodesById.get(edge.to);
    if (!fromNode || !toNode) continue;

    const fromKey = horizontal
      ? Math.round(fromNode.x + fromNode.width)
      : Math.round(fromNode.y + fromNode.height);
    const toKey = horizontal ? Math.round(toNode.x) : Math.round(toNode.y);
    const key = `${fromKey}-${toKey}`;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ edge, fromNode, toNode });
  }

  for (const group of groups.values()) {
    group.sort((a, b) => {
      const aMain = horizontal ? a.fromNode.y : a.fromNode.x;
      const bMain = horizontal ? b.fromNode.y : b.fromNode.x;
      return aMain - bMain;
    });
    group.forEach((item, index) => {
      channels.set(item.edge, index - (group.length - 1) / 2);
    });
  }

  return channels;
}

function buildHorizontalCurvePath(start, end, channel = 0, channelGap = 14) {
  const dx = end.x - start.x;
  const offset = channel * channelGap;
  const bend = Math.max(24, dx * 0.45) + offset;
  const cp1x = start.x + bend;
  const cp1y = start.y;
  const cp2x = end.x - bend;
  const cp2y = end.y;
  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
}

function buildVerticalCurvePath(start, end, channel = 0, channelGap = 16) {
  const dy = end.y - start.y;
  const offset = channel * channelGap;
  const bend = Math.max(24, Math.abs(dy) * 0.45) + offset;
  const cp1x = start.x;
  const cp1y = start.y + Math.sign(dy || 1) * bend;
  const cp2x = end.x;
  const cp2y = end.y - Math.sign(dy || 1) * bend;
  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
}

function renderColumnEdge(edge, fromNode, toNode, channel = 0) {
  const start = anchorPoint(fromNode, "right");
  const end = anchorPoint(toNode, "left");
  const labelX = (start.x + end.x) / 2;
  const labelY = (start.y + end.y) / 2;
  const channelGap = 14;

  const path =
    Math.abs(start.y - end.y) < 2
      ? `M ${start.x} ${start.y} L ${end.x} ${end.y}`
      : buildHorizontalCurvePath(start, end, channel, channelGap);

  const labelMarkup = edge.label
    ? `<text x="${labelX}" y="${labelY - 6}" text-anchor="middle" font-size="12"
        fill="var(--vp-c-text-2, #666)">${escapeXml(edge.label)}</text>`
    : "";

  return `
    <path d="${path}" fill="none" stroke="${escapeXml(edge.stroke || "#666")}"
      stroke-width="1.5" stroke-linecap="round" marker-end="url(#svg-utils-arrow)" />
    ${labelMarkup}
  `;
}

function renderFlowEdge(edge, fromNode, toNode, channel = 0) {
  if (!fromNode || !toNode) return "";

  const start = anchorPoint(fromNode, "bottom");
  const end = anchorPoint(toNode, "top");
  const channelGap = 16;
  const labelX = (start.x + end.x) / 2;
  const labelY = (start.y + end.y) / 2;

  const path =
    Math.abs(start.x - end.x) < 2
      ? `M ${start.x} ${start.y} L ${end.x} ${end.y}`
      : buildVerticalCurvePath(start, end, channel, channelGap);

  const labelMarkup = edge.label
    ? `<text x="${labelX}" y="${labelY - 6}" text-anchor="middle" font-size="12"
        fill="var(--vp-c-text-2, #666)">${escapeXml(edge.label)}</text>`
    : "";

  return `
    <path d="${path}" fill="none" stroke="${escapeXml(edge.stroke || "#666")}"
      stroke-width="1.5" stroke-linecap="round" marker-end="url(#svg-utils-arrow)" />
    ${labelMarkup}
  `;
}

function isVerticalDirection(direction) {
  return direction === "vertical" || direction === "纵向" || direction === "v";
}

/**
 * 将流程图数据渲染为 SVG 字符串
 */
export function renderDiagramSvg(diagram) {
  const direction = diagram.direction || "horizontal";
  const edges = diagram.edges || [];
  const vertical = isVerticalDirection(direction);
  const nodes = layoutNodes(diagram.nodes || [], edges, vertical ? "vertical" : "horizontal");

  if (!nodes.length) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120">
      <text x="24" y="60" font-size="14" fill="var(--vp-c-text-2, #666)">未找到可绘制的节点</text>
    </svg>`;
  }

  const nodesById = nodeMap(nodes);
  const edgeChannels = assignEdgeChannels(edges, nodesById, vertical ? "vertical" : "horizontal");
  const { parents } = buildGraph(nodes, edges);
  const rootId = findRoots(diagram.nodes || [], parents)[0]?.id || "";
  const view = computeViewBox(nodes, 24, rootId);
  const edgeMarkup = edges
    .map((edge) => {
      const fromNode = nodesById.get(edge.from);
      const toNode = nodesById.get(edge.to);
      if (!fromNode || !toNode) return "";
      const channel = edgeChannels.get(edge) ?? 0;
      return vertical
        ? renderFlowEdge(edge, fromNode, toNode, channel)
        : renderColumnEdge(edge, fromNode, toNode, channel);
    })
    .join("");
  const nodeMarkup = nodes.map((node) => renderNode(node)).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${view.width}" height="${view.height}" viewBox="${view.x} ${view.y} ${view.width} ${view.height}" data-root-id="${escapeXml(rootId)}">
    <defs>
      <marker id="svg-utils-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4"
        orient="auto" markerUnits="strokeWidth">
        <path d="M 0 0 L 8 4 L 0 8 z" fill="#666666" />
      </marker>
    </defs>
    ${edgeMarkup}
    ${nodeMarkup}
  </svg>`;
}

function computeViewBox(nodes, padding = 24, startId = "") {
  const minX = Math.min(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxX = Math.max(...nodes.map((node) => node.x + node.width));
  const maxY = Math.max(...nodes.map((node) => node.y + node.height));

  const start = startId ? nodes.find((node) => node.id === startId) : null;
  const anchorY = start ? nodeCenterY(start) : (minY + maxY) / 2;

  const above = anchorY - minY;
  const below = maxY - anchorY;
  const padTop = padding + Math.max(0, below - above);
  const padBottom = padding + Math.max(0, above - below);

  return {
    x: minX - padding,
    y: minY - padTop,
    width: Math.max(maxX - minX + padding * 2, 240),
    height: Math.max(maxY - minY + padTop + padBottom, 120),
  };
}
