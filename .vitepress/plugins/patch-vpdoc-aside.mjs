import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CUSTOM_VPDOC = path.resolve(__dirname, "../theme/components/VPDoc.vue");
const VPDOC_SUFFIX = "theme-default/components/VPDoc.vue";

function isVPDocId(id) {
  if (!id || id.includes("?")) return false;
  const normalized = id.replace(/\\/g, "/");
  return (
    normalized.endsWith(VPDOC_SUFFIX) ||
    normalized === CUSTOM_VPDOC.replace(/\\/g, "/")
  );
}

/** 用自定义 VPDoc.vue 替换默认组件（dev / build 均生效） */
export function patchVPDocAsideWidth() {
  return {
    name: "patch-vpdoc-aside-width",
    enforce: "pre",
    resolveId(source) {
      if (!source) return;
      const normalized = source.replace(/\\/g, "/");
      if (normalized.endsWith(VPDOC_SUFFIX)) {
        return CUSTOM_VPDOC;
      }
    },
    load(id) {
      if (!isVPDocId(id)) return;
      return fs.readFileSync(CUSTOM_VPDOC, "utf-8");
    },
  };
}
