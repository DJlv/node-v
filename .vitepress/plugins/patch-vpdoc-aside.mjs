import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CUSTOM_VPDOC = path.resolve(__dirname, "../theme/components/VPDoc.vue");

/** 用自定义 VPDoc.vue 替换默认组件，扩大右侧文章目录宽度 */
export function patchVPDocAsideWidth() {
  return {
    name: "patch-vpdoc-aside-width",
    enforce: "pre",
    load(id) {
      // 仅替换主 .vue 模块，跳过 ?vue&type=style 等子请求
      if (id.includes("?")) {
        return;
      }

      const normalizedId = id.replace(/\\/g, "/");
      if (!normalizedId.endsWith("theme-default/components/VPDoc.vue")) {
        return;
      }

      return fs.readFileSync(CUSTOM_VPDOC, "utf-8");
    },
  };
}
