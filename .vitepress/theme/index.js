import { h } from "vue";
import { useData, useRoute } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";
import "./code-block-fold.css";

import imgUtils from "../../componts/imgUtils.vue";
import tableUtils from "../../componts/tableUtils.vue";
import svgUtils from "../../componts/svgUtils.vue";
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
    app.component("imgUtils", imgUtils);
    app.component("tableUtils", tableUtils);
    app.component("svgUtils", svgUtils);
  },
};
