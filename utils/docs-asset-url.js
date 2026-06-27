const ASSET_MARKER = "__docs_asset__/";

/** 构建 tableUtils / imgUtils 使用的资源 URL */
export function buildDocsAssetUrl(relativePath, base = "/node-v/", dev = false) {
  const file = String(relativePath || "").replace(/^\//, "");
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
