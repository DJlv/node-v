import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const IMAGE_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
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
};

function walkDocsImgFiles(docsRoot, files = []) {
  if (!fs.existsSync(docsRoot)) return files;

  for (const name of fs.readdirSync(docsRoot)) {
    const fullPath = path.join(docsRoot, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (name === "img") {
        for (const fileName of fs.readdirSync(fullPath)) {
          const imgPath = path.join(fullPath, fileName);
          if (fs.statSync(imgPath).isFile() && IMAGE_EXT.has(path.extname(fileName).toLowerCase())) {
            files.push(imgPath);
          }
        }
      } else {
        walkDocsImgFiles(fullPath, files);
      }
    }
  }

  return files;
}

function resolveDocsImgRequest(urlPath, base, projectRoot) {
  const normalized = decodeURIComponent((urlPath || "").split("?")[0]);
  const withoutBase = normalized.startsWith(base)
    ? normalized.slice(base.length)
    : normalized.replace(/^\//, "");

  if (!withoutBase.includes("/img/")) return null;

  const filePath = path.join(projectRoot, withoutBase);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  if (!IMAGE_EXT.has(path.extname(filePath).toLowerCase())) return null;
  return filePath;
}

// docs 下各目录的 img 子目录在 dev/build 中均可通过 /docs/.../img/... 访问
export function docsCoLocatedImgPlugin(base = "/node-v/") {
  const pluginDir = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(pluginDir, "../..");
  const docsRoot = path.join(projectRoot, "docs");

  return {
    name: "vitepress-docs-co-located-img",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const filePath = resolveDocsImgRequest(req.url, base, projectRoot);
        if (!filePath) return next();

        const ext = path.extname(filePath).toLowerCase();
        res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
        fs.createReadStream(filePath).pipe(res);
      });
    },
    closeBundle() {
      const outDir = path.join(projectRoot, ".vitepress", "dist");
      if (!fs.existsSync(outDir)) return;

      for (const filePath of walkDocsImgFiles(docsRoot)) {
        const relative = path.relative(projectRoot, filePath).replace(/\\/g, "/");
        const target = path.join(outDir, relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(filePath, target);
      }
    },
  };
}
