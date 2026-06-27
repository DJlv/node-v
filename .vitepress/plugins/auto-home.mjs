import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareAutoHomes } from "../../utils/auto-gen-index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(__dirname, "../../docs");

/** 开发时 docs 结构变化后重新生成 home.md */
export function autoHomeWatchPlugin() {
  return {
    name: "vitepress-auto-home-watch",
    configureServer(server) {
      const regen = () => prepareAutoHomes();

      server.watcher.on("add", (file) => {
        if (file.startsWith(DOCS_ROOT) && !file.endsWith("home.md")) regen();
      });
      server.watcher.on("unlink", (file) => {
        if (file.startsWith(DOCS_ROOT) && !file.endsWith("home.md")) regen();
      });
    },
  };
}
