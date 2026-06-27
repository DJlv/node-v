// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import { useData, useRoute } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";
import "./code-block-fold.css";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import imgUtils from "../../docs/componts/imgUtils.vue";
import tableUtils from "../../docs/componts/tableUtils.vue";
import svgUtils from "../../docs/componts/svgUtils.vue";
import { useCodeBlockFold } from "../plugins/code-block-fold.mjs";

/** @type {import('vitepress').Theme} */
export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {});
  },
  setup() {
    const { frontmatter } = useData();
    const route = useRoute();
    // 默认折叠：≥4 行的代码块折叠为显示 3 行；单页 frontmatter 用 cbf: false 关闭
    useCodeBlockFold({ route, frontmatter }, true, 3, 4);
  },
  enhanceApp({ app }) {
    app.use(ElementPlus);
    app.component("imgUtils", imgUtils);
    app.component("tableUtils", tableUtils);
    app.component("svgUtils", svgUtils);
  },
};
