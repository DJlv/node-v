const ASSET_MARKER = "__docs_asset__/";

/** 统一为 docs/ 开头的资源相对路径（与 dist 复制规则一致） */
export function normalizeAssetPath(relativePath) {
  const file = String(relativePath || "").replace(/^\//, "").replace(/\\/g, "/");
  if (!file) return "";
  if (file.startsWith("docs/")) return file;
  return `docs/${file}`;
}

/** 构建 tableUtils / imgUtils 使用的资源 URL */
export function buildDocsAssetUrl(relativePath, base = "/node-v/", dev = false) {
  const file = normalizeAssetPath(relativePath);
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;

  if (dev) {
    return `${normalizedBase}${ASSET_MARKER}${encodeURI(file)}`;
  }

  return `${normalizedBase}${file
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export { ASSET_MARKER };
