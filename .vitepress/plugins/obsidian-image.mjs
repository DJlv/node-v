import path from "node:path";

const WIKI_EMBED_RE = /^!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]$/;
const WIKI_TABLE_RE = /^\[\[([^\]|]+\.(?:xlsx|xlsm|xls))(?:\|([^\]]*))?\]\]$/i;
const WIKI_EMBED_INLINE_RE = /^!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/;
const WIKI_TABLE_INLINE_RE = /^\[\[([^\]|]+\.(?:xlsx|xlsm|xls))(?:\|([^\]]*))?\]\]/i;
const EXCEL_FILE_RE = /\.(xlsx|xlsm|xls)$/i;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getMdDir(env) {
  if (env?.relativePath) {
    return path.dirname(env.relativePath).replace(/\\/g, "/");
  }
  return "";
}

function resolveCoLocatedAsset(mdDir, subDir, target) {
  const file = target.trim().replace(new RegExp(`^\\.?\\/?${subDir}[/\\\\]`, "i"), "");
  return mdDir
    ? `${mdDir}/${subDir}/${file.replace(/\\/g, "/")}`
    : `${subDir}/${file.replace(/\\/g, "/")}`;
}

function toImgUtils(target, altOverride, mdDir) {
  const file = target.trim().replace(/^\.?\/?img[/\\]/, "");
  const alt = altOverride?.trim() || path.basename(file, path.extname(file));
  const assetPath = resolveCoLocatedAsset(mdDir, "img", file);
  return `<imgUtils urls="${escapeHtml(assetPath)}" alt="${escapeHtml(alt)}"></imgUtils>`;
}

function defaultSheetName(target, sheetOverride) {
  const trimmed = sheetOverride?.trim();
  if (trimmed) return trimmed;
  const file = target.trim();
  return path.basename(file, path.extname(file));
}

function toTableUtils(target, sheetName, mdDir) {
  const assetPath = resolveCoLocatedAsset(mdDir, "excel", target);
  return `<tableUtils urls="${escapeHtml(assetPath)}" sheetName="${escapeHtml(defaultSheetName(target, sheetName))}"></tableUtils>`;
}

function toWikiEmbed(target, pipeValue, mdDir) {
  const file = target.trim();
  if (EXCEL_FILE_RE.test(file)) {
    return toTableUtils(file, pipeValue, mdDir);
  }
  return toImgUtils(target, pipeValue, mdDir);
}

function pushHtmlBlock(state, startLine, html) {
  const token = state.push("html_block", "", 0);
  token.content = html;
  token.map = [startLine, startLine + 1];
  state.line = startLine + 1;
}

function pushHtmlInline(state, pos, html, length) {
  const token = state.push("html_inline", "", 0);
  token.content = html;
  state.pos = pos + length;
}

function parseWikiBlockLine(line) {
  const embedMatch = line.match(WIKI_EMBED_RE);
  if (embedMatch) {
    return { type: "embed", target: embedMatch[1], pipe: embedMatch[2] };
  }

  const tableMatch = line.match(WIKI_TABLE_RE);
  if (tableMatch) {
    return { type: "table", target: tableMatch[1], pipe: tableMatch[2] };
  }

  return null;
}

function parseWikiInline(text) {
  if (text.startsWith("!")) {
    const embedMatch = text.match(WIKI_EMBED_INLINE_RE);
    if (embedMatch) {
      return { type: "embed", target: embedMatch[1], pipe: embedMatch[2], length: embedMatch[0].length };
    }
    return null;
  }

  const tableMatch = text.match(WIKI_TABLE_INLINE_RE);
  if (tableMatch) {
    return { type: "table", target: tableMatch[1], pipe: tableMatch[2], length: tableMatch[0].length };
  }

  return null;
}

function renderWiki(parsed, mdDir) {
  if (parsed.type === "embed") {
    return toWikiEmbed(parsed.target, parsed.pipe, mdDir);
  }
  return toTableUtils(parsed.target, parsed.pipe, mdDir);
}

export function obsidianImagePlugin(md) {
  md.block.ruler.before("paragraph", "obsidian-wiki-block", (state, startLine, endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(pos, max).trim();
    const parsed = parseWikiBlockLine(line);
    if (!parsed) return false;
    if (silent) return true;

    pushHtmlBlock(state, startLine, renderWiki(parsed, getMdDir(state.env)));
    return true;
  });

  md.inline.ruler.before("image", "obsidian-wiki-embed-inline", (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x21) return false;

    const parsed = parseWikiInline(state.src.slice(state.pos));
    if (!parsed || parsed.type !== "embed") return false;
    if (silent) return true;

    pushHtmlInline(state, state.pos, renderWiki(parsed, getMdDir(state.env)), parsed.length);
    return true;
  });

  md.inline.ruler.before("link", "obsidian-wiki-table-inline", (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x5b) return false;
    if (state.pos > 0 && state.src.charCodeAt(state.pos - 1) === 0x21) return false;

    const parsed = parseWikiInline(state.src.slice(state.pos));
    if (!parsed || parsed.type !== "table") return false;
    if (silent) return true;

    pushHtmlInline(state, state.pos, renderWiki(parsed, getMdDir(state.env)), parsed.length);
    return true;
  });
}

export function obsidianImageMarkdownConfig(md) {
  obsidianImagePlugin(md);
}
