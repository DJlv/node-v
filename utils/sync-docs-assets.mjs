import fs from "node:fs";
import path from "node:path";
import { ASSET_MARKER } from "./docs-asset-url.js";

const COLOCATED_DIRS = ["img", "excel", "files"];

const ALLOWED_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
  ".xlsx",
  ".xlsm",
  ".xls",
  ".pdf",
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".mp3",
  ".wav",
  ".m4a",
  ".flac",
  ".zip",
  ".rar",
  ".7z",
  ".tar",
  ".gz",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
]);

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xlsm": "application/vnd.ms-excel.sheet.macroEnabled.12",
  ".xls": "application/vnd.ms-excel",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "audio/ogg",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".7z": "application/x-7z-compressed",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export function walkCoLocatedAssets(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    if (!fs.statSync(fullPath).isDirectory()) continue;

    if (COLOCATED_DIRS.includes(name)) {
      for (const fileName of fs.readdirSync(fullPath)) {
        const assetPath = path.join(fullPath, fileName);
        if (
          fs.statSync(assetPath).isFile() &&
          ALLOWED_EXT.has(path.extname(fileName).toLowerCase())
        ) {
          files.push(assetPath);
        }
      }
      continue;
    }

    walkCoLocatedAssets(fullPath, files);
  }

  return files;
}

function decodeUrlPath(value) {
  let decoded = value;
  for (let i = 0; i < 2; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded.replace(/\\/g, "/").replace(/^\//, "");
}

function streamAssetFile(filePath, res) {
  const size = fs.statSync(filePath).size;
  if (size === 0) {
    res.statusCode = 422;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("empty file");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
}

/** 统计 docs 下 img、excel 资源数量 */
export function countCoLocatedAssets(projectRoot) {
  const docsRoot = path.join(projectRoot, "docs");
  return walkCoLocatedAssets(docsRoot).length;
}

export function findCoLocatedAsset(projectRoot, urlPath) {
  const withoutLeadingSlash = decodeUrlPath(urlPath);
  if (!withoutLeadingSlash) return null;

  const directPath = path.join(projectRoot, withoutLeadingSlash);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    const ext = path.extname(directPath).toLowerCase();
    if (ALLOWED_EXT.has(ext)) return directPath;
  }

  if (!/\/(img|excel|files)\//.test(withoutLeadingSlash)) return null;

  const fileName = path.basename(withoutLeadingSlash);
  const subDir = withoutLeadingSlash.includes("/excel/")
    ? "excel"
    : withoutLeadingSlash.includes("/files/")
      ? "files"
      : "img";
  const docsRoot = path.join(projectRoot, "docs");
  const matches = walkCoLocatedAssets(docsRoot).filter(
    (filePath) =>
      path.basename(filePath).toLowerCase() === fileName.toLowerCase() &&
      filePath.split(path.sep).includes(subDir),
  );

  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    const urlDir = path.dirname(withoutLeadingSlash).split("/").pop()?.toLowerCase();
    const narrowed = matches.filter((filePath) => {
      const parts = filePath.split(path.sep);
      const parentDir = parts[parts.length - 3]?.toLowerCase();
      return !urlDir || parentDir === urlDir;
    });
    return narrowed[0] || matches[0];
  }

  return null;
}

export function copyDocsAssetsToDist(projectRoot, outDir) {
  const docsRoot = path.join(projectRoot, "docs");
  if (!fs.existsSync(outDir)) return 0;

  let count = 0;
  for (const filePath of walkCoLocatedAssets(docsRoot)) {
    const relative = path.relative(projectRoot, filePath).replace(/\\/g, "/");
    const target = path.join(outDir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(filePath, target);
    count += 1;
  }
  return count;
}

export { buildDocsAssetUrl } from "./docs-asset-url.js";

export function createDocsAssetMiddleware(base, projectRoot) {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;

  const handler = (req, res, next) => {
    const rawUrl = (req.url || "").split("?")[0];

    const markerIndex = rawUrl.indexOf(ASSET_MARKER);
    if (markerIndex !== -1) {
      const encoded = rawUrl.slice(markerIndex + ASSET_MARKER.length);
      const relPath = decodeUrlPath(encoded);
      const filePath = findCoLocatedAsset(projectRoot, relPath);
      if (!filePath) {
        res.statusCode = 404;
        res.end(`Asset not found: ${relPath}`);
        return;
      }
      streamAssetFile(filePath, res);
      return;
    }

    let withoutBase = rawUrl;
    try {
      withoutBase = decodeURIComponent(rawUrl);
    } catch {
      // keep raw url
    }
    if (withoutBase.startsWith(normalizedBase)) {
      withoutBase = withoutBase.slice(normalizedBase.length);
    } else {
      withoutBase = withoutBase.replace(/^\//, "");
    }

    if (!/\/(img|excel|files)\//.test(withoutBase)) return next();

    const filePath = findCoLocatedAsset(projectRoot, withoutBase);
    if (!filePath) return next();

    streamAssetFile(filePath, res);
  };

  return handler;
}

export function installDocsAssetMiddleware(server, base, projectRoot) {
  const handler = createDocsAssetMiddleware(base, projectRoot);
  server.middlewares.stack.unshift({ route: "", handle: handler });
}
