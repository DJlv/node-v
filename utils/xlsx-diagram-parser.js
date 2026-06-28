import { readNodeCellColors, readSheetStyleMap } from "./xlsx-cell-style.js";

const HEADER_ALIASES = {
  type: ["type", "类型", "kind", "类别"],
  id: ["id", "编号", "节点", "node", "节点id", "节点编号", "name"],
  label: ["label", "text", "文本", "名称", "title", "节点名", "显示", "内容"],
  fill: ["fill", "填充", "bgcolor", "背景", "背景色"],
  stroke: ["stroke", "边框", "线色", "border", "边框色"],
  textColor: ["textcolor", "文本色", "文字色", "字体色", "fontcolor", "labelcolor"],
  x: ["x", "left", "横坐标"],
  y: ["y", "top", "纵坐标"],
  order: ["order", "顺序", "序号", "sort", "index", "排序", "步骤"],
  width: ["width", "宽", "w"],
  height: ["height", "高", "h"],
  shape: ["shape", "形状"],
  from: ["from", "来源", "起点", "源", "起始", "fromid", "源节点", "前置", "前置节点"],
  to: ["to", "目标", "终点", "目的", "toid", "目标节点", "节点"],
  predecessors: ["predecessors", "前置节点", "前置", "依赖", "deps", "predecessor", "depends"],
  direction: ["direction", "方向", "layout", "布局"],
};

const NODE_TYPE = new Set(["node", "节点", "n"]);
const EDGE_TYPE = new Set(["edge", "连线", "边", "线", "link", "arrow"]);
const EDGE_SHEET_NAMES = new Set(["edges", "edge", "links", "连线", "边", "线"]);
const NODE_SHEET_NAMES = new Set(["nodes", "node", "节点"]);
const PREREQUISITE_SHEET_NAMES = new Set([
  "prerequisites",
  "prerequisite",
  "deps",
  "依赖",
  "前置",
  "前置节点",
]);

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function buildHeaderMap(headers) {
  const map = {};
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    if (!normalized) return;
    for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((alias) => normalizeHeader(alias) === normalized)) {
        map[key] = index;
      }
    }
  });
  return map;
}

function cellValue(row, index) {
  if (index == null || index < 0) return "";
  const value = row[index];
  if (value == null) return "";
  return String(value).trim();
}

function parseNumber(value) {
  if (value === "" || value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function sheetToRows(sheet, xlsx) {
  return xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });
}

function findHeaderRowIndex(rows) {
  for (let index = 0; index < Math.min(rows.length, 20); index += 1) {
    const row = rows[index];
    if (!Array.isArray(row)) continue;
    const map = buildHeaderMap(row);
    if (map.id != null || map.label != null || map.from != null || map.type != null) {
      return index;
    }
  }
  return 0;
}

function rowKind(row, map) {
  const typeValue = cellValue(row, map.type).toLowerCase();
  if (EDGE_TYPE.has(typeValue)) return "edge";
  if (NODE_TYPE.has(typeValue)) return "node";

  const from = cellValue(row, map.from);
  const to = cellValue(row, map.to);
  const id = cellValue(row, map.id);
  const label = cellValue(row, map.label);
  const predecessors = cellValue(row, map.predecessors);

  if (predecessors && (id || to)) return "prerequisite";
  if (from && to && !id && !label) return "edge";
  if (from && to && typeValue) return "edge";
  if (id || label) return "node";
  if (from && to) return "edge";
  return "";
}

function parseNodeRow(row, map, context) {
  const id = cellValue(row, map.id) || cellValue(row, map.label);
  const label = cellValue(row, map.label) || id;
  if (!id) return null;

  const colors = readNodeCellColors({
    ...context,
    rowIndex: context.rowIndex,
    map,
  });

  return {
    id,
    label,
    fill: colors.fill,
    stroke: colors.stroke,
    textColor: colors.textColor,
    x: parseNumber(cellValue(row, map.x)),
    y: parseNumber(cellValue(row, map.y)),
    order: parseNumber(cellValue(row, map.order)),
    width: parseNumber(cellValue(row, map.width)),
    height: parseNumber(cellValue(row, map.height)),
    shape: cellValue(row, map.shape).toLowerCase() || "rounded",
  };
}

function parseEdgeRow(row, map, context) {
  const from = cellValue(row, map.from);
  const to = cellValue(row, map.to);
  if (!from || !to) return null;

  const strokeAddr =
    map.stroke != null
      ? context.xlsx.utils.encode_cell({ r: context.rowIndex, c: map.stroke })
      : "";
  const strokeStyleIndex = strokeAddr ? context.styleMap.get(strokeAddr) : null;
  const strokeCell = strokeAddr ? context.sheet[strokeAddr] : null;

  let stroke = "#666666";
  if (strokeCell?.s?.patternType === "solid") {
    const direct =
      strokeCell.s.fgColor?.rgb &&
      `#${String(strokeCell.s.fgColor.rgb).replace(/^FF/i, "").slice(-6).toLowerCase()}`;
    if (direct) stroke = direct;
  } else if (strokeStyleIndex != null && context.workbook?.Styles) {
    const border = context.workbook.Styles.Borders?.[
      context.workbook.Styles.CellXf[strokeStyleIndex]?.borderId
    ];
    const rgb = border?.left?.color?.rgb;
    if (rgb) stroke = `#${String(rgb).replace(/^FF/i, "").slice(-6).toLowerCase()}`;
  }

  return {
    from,
    to,
    label: cellValue(row, map.label),
    stroke,
    order: parseNumber(cellValue(row, map.order)),
  };
}

function parsePrerequisiteRow(row, map) {
  const nodeId = cellValue(row, map.id) || cellValue(row, map.to);
  const predecessor =
    cellValue(row, map.predecessors) ||
    cellValue(row, map.from);
  if (!nodeId || !predecessor) return null;

  return {
    from: predecessor,
    to: nodeId,
    label: "",
    stroke: "#666666",
    order: parseNumber(cellValue(row, map.order)),
  };
}

function parseSheetDiagram(rows, xlsx, sheet, workbook, styleMap, mode = "auto") {
  if (!rows.length) return { nodes: [], edges: [], prerequisites: [], direction: "horizontal" };

  const headerIndex = findHeaderRowIndex(rows);
  const headers = rows[headerIndex] || [];
  const map = buildHeaderMap(headers);
  const directionRaw = cellValue(rows[headerIndex + 1], map.direction).toLowerCase();
  const direction =
    directionRaw === "vertical" || directionRaw === "纵向" || directionRaw === "v"
      ? "vertical"
      : "horizontal";

  const nodes = [];
  const edges = [];
  const prerequisites = [];

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!Array.isArray(row)) continue;
    if (!row.some((cell) => String(cell ?? "").trim() !== "")) continue;

    const context = {
      sheet,
      workbook,
      styleMap,
      rowIndex: index,
      xlsx,
    };

    const kind =
      mode === "prerequisites"
        ? "prerequisite"
        : mode === "edges"
          ? "edge"
          : rowKind(row, map);

    if (kind === "prerequisite") {
      const prerequisite = parsePrerequisiteRow(row, map);
      if (prerequisite) prerequisites.push(prerequisite);
      continue;
    }

    if (kind === "edge") {
      const edge = parseEdgeRow(row, map, context);
      if (edge) edges.push(edge);
      continue;
    }

    const node = parseNodeRow(row, map, context);
    if (node) nodes.push(node);
  }

  return { nodes, edges, prerequisites, direction };
}

function resolveSheetName(workbook, preferredName, candidates = NODE_SHEET_NAMES) {
  const names = workbook.SheetNames || [];
  if (preferredName && names.includes(preferredName)) return preferredName;

  for (const candidate of candidates) {
    const found = names.find((name) => normalizeHeader(name) === normalizeHeader(candidate));
    if (found) return found;
  }

  return names[0];
}

function findCompanionSheet(workbook, nodesSheetName, candidates) {
  const names = workbook.SheetNames || [];
  for (const candidate of candidates) {
    const found = names.find(
      (name) =>
        name !== nodesSheetName && normalizeHeader(name) === normalizeHeader(candidate),
    );
    if (found) return found;
  }
  return names.find(
    (name) =>
      name !== nodesSheetName &&
      [...candidates].some((token) => normalizeHeader(name).includes(normalizeHeader(token))),
  );
}

function groupNodesByOrder(nodes) {
  const groups = new Map();
  for (const node of nodes) {
    const order = node.order ?? Number.MAX_SAFE_INTEGER;
    if (!groups.has(order)) groups.set(order, []);
    groups.get(order).push(node);
  }
  return groups;
}

function buildAutoEdgesBetweenOrderGroups(nodes) {
  const groups = groupNodesByOrder(nodes);
  const orders = [...groups.keys()].sort((a, b) => a - b);
  const edges = [];

  for (let index = 0; index < orders.length - 1; index += 1) {
    const fromGroup = groups.get(orders[index]) || [];
    const toGroup = groups.get(orders[index + 1]) || [];
    for (const fromNode of fromGroup) {
      for (const toNode of toGroup) {
        edges.push({
          from: fromNode.id,
          to: toNode.id,
          label: "",
          stroke: "#666666",
          order: index + 1,
        });
      }
    }
  }

  return edges;
}

/**
 * 从 xlsx 工作簿解析流程图数据（节点、连线、颜色、顺序等）
 */
export function parseDiagramFromWorkbook(workbook, xlsx, sheetName = "", buffer = null) {
  const nodesSheetName = resolveSheetName(workbook, sheetName);
  const nodeSheet = workbook.Sheets[nodesSheetName];
  const nodeStyleMap = readSheetStyleMap(buffer, workbook, nodesSheetName);
  const nodeRows = sheetToRows(nodeSheet, xlsx);
  const primary = parseSheetDiagram(
    nodeRows,
    xlsx,
    nodeSheet,
    workbook,
    nodeStyleMap,
    "nodes",
  );

  let edges = [...primary.edges];
  let prerequisites = [];

  const edgeSheetName = findCompanionSheet(workbook, nodesSheetName, EDGE_SHEET_NAMES);
  if (edgeSheetName) {
    const edgeSheet = workbook.Sheets[edgeSheetName];
    const edgeStyleMap = readSheetStyleMap(buffer, workbook, edgeSheetName);
    const edgeRows = sheetToRows(edgeSheet, xlsx);
    const parsedEdges = parseSheetDiagram(
      edgeRows,
      xlsx,
      edgeSheet,
      workbook,
      edgeStyleMap,
      "edges",
    );
    edges = edges.concat(parsedEdges.edges);
  }

  const prereqSheetName = findCompanionSheet(
    workbook,
    nodesSheetName,
    PREREQUISITE_SHEET_NAMES,
  );
  if (prereqSheetName) {
    const prereqSheet = workbook.Sheets[prereqSheetName];
    const prereqStyleMap = readSheetStyleMap(buffer, workbook, prereqSheetName);
    const prereqRows = sheetToRows(prereqSheet, xlsx);
    const parsedPrereq = parseSheetDiagram(
      prereqRows,
      xlsx,
      prereqSheet,
      workbook,
      prereqStyleMap,
      "prerequisites",
    );
    prerequisites = parsedPrereq.prerequisites;
  }

  if (prerequisites.length) {
    edges = edges.concat(prerequisites);
  } else if (!edges.length && primary.nodes.length > 1) {
    edges = buildAutoEdgesBetweenOrderGroups(primary.nodes);
  }

  edges.sort((a, b) => {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.order ?? Number.MAX_SAFE_INTEGER;
    return ao - bo;
  });

  return {
    nodes: primary.nodes,
    edges,
    direction: primary.direction,
    sheetName: nodesSheetName,
  };
}
