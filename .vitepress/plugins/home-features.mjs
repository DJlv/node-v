import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CUSTOM_HOME_FEATURES = path.resolve(
  __dirname,
  "../theme/components/VPHomeFeaturesAuto.vue",
);

/** 注入首页 features 虚拟模块 */
export function homeFeaturesPlugin(homeFeaturesMap) {
  const virtualId = "virtual:home-features-map";
  const resolvedVirtualId = `\0${virtualId}`;

  return {
    name: "home-features",
    enforce: "pre",
    resolveId(id) {
      if (id === virtualId) return resolvedVirtualId;
    },
    load(id) {
      if (id === resolvedVirtualId) {
        return `export const homeFeaturesMap = ${JSON.stringify(homeFeaturesMap)};`;
      }
    },
  };
}

/** 用自定义组件替换默认 VPHomeFeatures */
export function patchHomeFeaturesComponent() {
  return {
    name: "patch-home-features-component",
    enforce: "pre",
    load(id) {
      if (id.includes("?")) return;

      const normalizedId = id.replace(/\\/g, "/");
      if (
        !normalizedId.endsWith("theme-default/components/VPHomeFeatures.vue")
      ) {
        return;
      }

      return fs.readFileSync(CUSTOM_HOME_FEATURES, "utf-8");
    },
  };
}
