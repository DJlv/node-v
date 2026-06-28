import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  copyDocsAssetsToDist,
  countCoLocatedAssets,
  installDocsAssetMiddleware,
} from "../../utils/sync-docs-assets.mjs";

// dev/preview 直接从 docs/**/{img,excel,files} 读取；build 时复制到 dist
export function docsCoLocatedImgPlugin(base = "/node-v/") {
  const pluginDir = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(pluginDir, "../..");

  const attachMiddleware = (server) => {
    const count = countCoLocatedAssets(projectRoot);
    if (count > 0) {
      console.log(`[docs-assets] serving ${count} files from docs/**/{img,excel,files}`);
    } else {
      console.warn(
        "[docs-assets] no asset files under docs/**/{img,excel,files}",
      );
    }

    installDocsAssetMiddleware(server, base, projectRoot);
  };

  return {
    name: "vitepress-docs-co-located-assets",
    enforce: "pre",
    configureServer(server) {
      attachMiddleware(server);
    },
    configurePreviewServer(server) {
      attachMiddleware(server);
    },
    closeBundle() {
      const outDir = path.join(projectRoot, ".vitepress", "dist");
      const count = copyDocsAssetsToDist(projectRoot, outDir);
      if (count > 0) {
        console.log(`[docs-assets] copied ${count} files from docs/ into dist`);
      }
    },
  };
}
