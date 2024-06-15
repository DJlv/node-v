// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import imgUtils from "../../docs/componts/imgUtils.vue";
import tableUtils from "../../docs/componts/tableUtils.vue";
import svgUtils from "../../docs/componts/svgUtils.vue";


/** @type {import('vitepress').Theme} */
export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {      
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app, router, siteData }) {
    // ...
    app.use(ElementPlus);
    app.component("imgUtils", imgUtils);
    app.component("tableUtils", tableUtils);
    app.component("svgUtils", svgUtils);
  },
}
