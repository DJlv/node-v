import path from "node:path";
import { SITE_BASE } from "../../utils/site-base.js";

const WIKI_EMBED_RE = /^!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]$/;
const WIKI_LINK_RE = /^\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]$/;
const WIKI_EMBED_INLINE_RE = /^!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/;
const WIKI_LINK_INLINE_RE = /^\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/;

const EXCEL_FILE_RE = /\.(xlsx|xlsm|xls)$/i;
const PDF_FILE_RE = /\.pdf$/i;
const VIDEO_FILE_RE = /\.(mp4|webm|mov|ogg)$/i;
const AUDIO_FILE_RE = /\.(mp3|wav|m4a|flac|ogg)$/i;
const IMAGE_FILE_RE = /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i;
const ATTACH_FILE_RE = /\.(zip|rar|7z|tar|gz|doc|docx|ppt|pptx)$/i;

const CALLOUT_MAP = {
  note: "tip",
  abstract: "info",
  info: "info",
  tip: "tip",
  success: "tip",
  question: "info",
  warning: "warning",
  caution: "warning",
  failure: "danger",
  danger: "danger",
  error: "danger",
  bug: "danger",
  example: "tip",
};

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

function resolveAssetSubDir(target) {
  const file = target.trim().toLowerCase();
  if (EXCEL_FILE_RE.test(file)) return "excel";
  if (
    PDF_FILE_RE.test(file) ||
    VIDEO_FILE_RE.test(file) ||
    AUDIO_FILE_RE.test(file) ||
    ATTACH_FILE_RE.test(file)
  ) {
    return "files";
  }
  return "img";
}

function classifyWikiTarget(target) {
  const file = target.trim();
  if (EXCEL_FILE_RE.test(file)) return "table";
  if (PDF_FILE_RE.test(file)) return "pdf";
  if (VIDEO_FILE_RE.test(file)) return "video";
  if (AUDIO_FILE_RE.test(file)) return "audio";
  if (IMAGE_FILE_RE.test(file)) return "image";
  if (ATTACH_FILE_RE.test(file)) return "attach";
  if (/\.[a-z0-9]+$/i.test(file)) return "attach";
  return "page";
}

function resolveWikiPagePath(target, mdDir) {
  const name = target.trim().replace(/\.md$/i, "").replace(/\\/g, "/");
  if (name.startsWith("docs/")) return name;
  if (name.includes("/")) return `docs/${name.replace(/^\/+/, "")}`;
  return mdDir ? `${mdDir}/${name}` : `docs/${name}`;
}

function toPageHref(target, mdDir) {
  const docPath = resolveWikiPagePath(target, mdDir);
  return `${SITE_BASE}${docPath}`.replace(/\/{2,}/g, "/");
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
  return path.basename(target.trim(), path.extname(target.trim()));
}

function toTableUtils(target, sheetName, mdDir) {
  const assetPath = resolveCoLocatedAsset(mdDir, "excel", target);
  return `<tableUtils urls="${escapeHtml(assetPath)}" sheetName="${escapeHtml(defaultSheetName(target, sheetName))}"></tableUtils>`;
}

function toPdfUtils(target, title, mdDir) {
  const assetPath = resolveCoLocatedAsset(mdDir, "files", target);
  const t = title?.trim() || path.basename(target.trim(), ".pdf");
  return `<pdfUtils urls="${escapeHtml(assetPath)}" title="${escapeHtml(t)}"></pdfUtils>`;
}

function toMediaUtils(target, kind, caption, mdDir) {
  const subDir = resolveAssetSubDir(target);
  const assetPath = resolveCoLocatedAsset(mdDir, subDir, target);
  return `<mediaUtils urls="${escapeHtml(assetPath)}" kind="${kind}" caption="${escapeHtml(caption?.trim() || "")}"></mediaUtils>`;
}

function toAttachUtils(target, label, mdDir) {
  const subDir = resolveAssetSubDir(target);
  const assetPath = resolveCoLocatedAsset(mdDir, subDir, target);
  return `<attachUtils urls="${escapeHtml(assetPath)}" label="${escapeHtml(label?.trim() || path.basename(target))}"></attachUtils>`;
}

function toPageLink(target, label, mdDir) {
  const text = label?.trim() || target.trim();
  const href = toPageHref(target, mdDir);
  return `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
}

function renderWikiEmbed(target, pipeValue, mdDir) {
  switch (classifyWikiTarget(target)) {
    case "table":
      return toTableUtils(target, pipeValue, mdDir);
    case "pdf":
      return toPdfUtils(target, pipeValue, mdDir);
    case "video":
      return toMediaUtils(target, "video", pipeValue, mdDir);
    case "audio":
      return toMediaUtils(target, "audio", pipeValue, mdDir);
    case "attach":
      return toAttachUtils(target, pipeValue, mdDir);
    default:
      return toImgUtils(target, pipeValue, mdDir);
  }
}

function renderWikiLink(target, pipeValue, mdDir) {
  switch (classifyWikiTarget(target)) {
    case "table":
      return toTableUtils(target, pipeValue, mdDir);
    case "attach":
      return toAttachUtils(target, pipeValue, mdDir);
    default:
      return toPageLink(target, pipeValue, mdDir);
  }
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

function parseWikiBlockLine(line, embed) {
  const re = embed ? WIKI_EMBED_RE : WIKI_LINK_RE;
  const match = line.match(re);
  if (!match) return null;
  return { target: match[1], pipe: match[2], embed };
}

function parseWikiInline(text, embed) {
  const re = embed ? WIKI_EMBED_INLINE_RE : WIKI_LINK_INLINE_RE;
  const match = text.match(re);
  if (!match) return null;
  return { target: match[1], pipe: match[2], length: match[0].length, embed };
}

function transformCallouts(src) {
  const lines = src.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const match = lines[i].match(/^>\s*\[!([a-zA-Z-]+)\]\s*(.*)$/);
    if (match) {
      const type = CALLOUT_MAP[match[1].toLowerCase()] || "info";
      const title = match[2].trim();
      const body = [];
      i += 1;
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      out.push(`::: ${type}${title ? ` ${title}` : ""}`);
      out.push(...body);
      out.push(":::");
      continue;
    }
    out.push(lines[i]);
    i += 1;
  }

  return out.join("\n");
}

export function obsidianImagePlugin(md) {
  md.core.ruler.before("normalize", "obsidian-callout", (state) => {
    if (!state.src.includes("[!")) return;
    state.src = transformCallouts(state.src);
  });

  md.block.ruler.before("paragraph", "obsidian-wiki-block", (state, startLine, endLine, silent) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine];
    const max = state.eMarks[startLine];
    const line = state.src.slice(pos, max).trim();

    const embed = parseWikiBlockLine(line, true);
    const link = embed ? null : parseWikiBlockLine(line, false);
    const parsed = embed || link;
    if (!parsed) return false;
    if (silent) return true;

    const html = parsed.embed
      ? renderWikiEmbed(parsed.target, parsed.pipe, getMdDir(state.env))
      : renderWikiLink(parsed.target, parsed.pipe, getMdDir(state.env));
    pushHtmlBlock(state, startLine, html);
    return true;
  });

  md.inline.ruler.before("image", "obsidian-wiki-embed-inline", (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x21) return false;
    const parsed = parseWikiInline(state.src.slice(state.pos), true);
    if (!parsed) return false;
    if (silent) return true;
    pushHtmlInline(
      state,
      state.pos,
      renderWikiEmbed(parsed.target, parsed.pipe, getMdDir(state.env)),
      parsed.length,
    );
    return true;
  });

  md.inline.ruler.before("link", "obsidian-wiki-link-inline", (state, silent) => {
    if (state.src.charCodeAt(state.pos) !== 0x5b) return false;
    if (state.pos > 0 && state.src.charCodeAt(state.pos - 1) === 0x21) return false;
    const parsed = parseWikiInline(state.src.slice(state.pos), false);
    if (!parsed) return false;
    if (silent) return true;
    pushHtmlInline(
      state,
      state.pos,
      renderWikiLink(parsed.target, parsed.pipe, getMdDir(state.env)),
      parsed.length,
    );
    return true;
  });
}

export function obsidianImageMarkdownConfig(md) {
  obsidianImagePlugin(md);
}
