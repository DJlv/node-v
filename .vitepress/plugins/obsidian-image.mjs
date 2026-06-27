import path from "node:path";

/** Obsidian 图片：![[name.png]] → 当前 md 同目录 img/ 下的 imgUtils */
const WIKI_IMAGE_RE = /!\[\[([^\]|]+?)(?:\|([^\]]*))?\]\]/g;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toImgUtils(target, altOverride, mdDir) {
  const file = target.trim().replace(/^\.?\/?img[/\\]/, "");
  const alt = altOverride?.trim() || path.basename(file, path.extname(file));
  const assetPath = mdDir
    ? `${mdDir}/img/${file.replace(/\\/g, "/")}`
    : `img/${file.replace(/\\/g, "/")}`;
  return `<imgUtils urls="${escapeHtml(assetPath)}" alt="${escapeHtml(alt)}"></imgUtils>`;
}

export function obsidianImagePlugin(md) {
  md.core.ruler.before("normalize", "obsidian-wiki-image", (state) => {
    if (!state.src.includes("![[")) return;

    const mdDir = state.env?.relativePath
      ? path.dirname(state.env.relativePath).replace(/\\/g, "/")
      : "";

    state.src = state.src.replace(WIKI_IMAGE_RE, (_, target, alt) =>
      toImgUtils(target, alt, mdDir),
    );
  });
}

export function obsidianImageMarkdownConfig(md) {
  obsidianImagePlugin(md);
}
