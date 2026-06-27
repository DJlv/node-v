import path from "node:path";
import { fileURLToPath } from "node:url";
import {withMermaid} from "vitepress-plugin-mermaid";
import { sidebar, navbar, homeFeaturesMap } from "../docs/sideBar.js"
import { resolveHomeFeaturesKey } from "../utils/auto-gen-sidebar.mjs"
import { patchVPDocAsideWidth } from "./plugins/patch-vpdoc-aside.mjs"
import {
    homeFeaturesPlugin,
    patchHomeFeaturesComponent,
} from "./plugins/home-features.mjs"
import { autoHomeWatchPlugin } from "./plugins/auto-home.mjs"

const configDir = path.dirname(fileURLToPath(import.meta.url));
const customVPDoc = path.resolve(configDir, "theme/components/VPDoc.vue");

/** 写入 HTML，确保线上一定加载（优先级高于组件 scoped 样式） */
const asideFixStyle = `
@media (min-width:1280px){
  .VPDoc.has-aside .aside,
  .VPDoc.has-aside .aside-container,
  .VPDoc.has-aside .aside-curtain,
  .VPDoc.has-aside .doc-aside-panel{
    width:360px!important;min-width:360px!important;max-width:360px!important;flex:0 0 360px!important;
  }
  .VPDoc.has-aside .doc-aside-nav,
  .VPDoc.has-aside .aside-content{
    background:var(--vp-c-bg-soft)!important;border:1px solid var(--vp-c-divider)!important;
    border-radius:10px!important;padding:14px 12px 12px!important;box-sizing:border-box!important;
  }
  .VPDoc.has-aside .VPDocAsideOutline .outline-title{
    margin:0 0 10px!important;padding:0 4px 10px!important;font-size:15px!important;
    border-bottom:1px solid var(--vp-c-divider)!important;
  }
  .VPDoc.has-aside .VPDocAsideOutline .outline-link{
    white-space:normal!important;overflow:visible!important;text-overflow:unset!important;
    word-break:break-word!important;display:block!important;width:100%!important;
    padding:6px 10px!important;margin:2px 0!important;border-radius:6px!important;
    font-size:13px!important;line-height:1.5!important;
  }
  .VPDoc.has-aside .VPDocAsideOutline .outline-link.active{
    color:var(--vp-c-brand-1)!important;font-weight:500!important;
    background:color-mix(in srgb,var(--vp-c-brand-soft) 70%,transparent)!important;
  }
}`;

// https://vitepress.dev/reference/site-config
export default withMermaid({
    base: '/node-v/',
    head: [
        ["link", {rel: "icon", href: "/node-v/logo.svg"}],
        ["style", {}, asideFixStyle],
    ],
    title: "文档网站",
    description: "",
    themeConfig: {
        outlineTitle: "文章目录",
        outline: [1, 6],
        // 顶部导航栏配置
        nav: navbar,
        sidebar: sidebar,
        socialLinks: [
            {icon: "github", link: "https://github.com/DJlv"},
            {icon: "twitter", link: "https://vitepress.dev/zh/guide/what-is-vitepress"}
        ],
        // navbar: true, //开启导航栏，我设置成false也没啥用不知道为啥
        // sidebar: false, // 关闭侧边栏
        // lastUpdated: true, // 显示上次修改时间
        // aside: "left", // 设置右侧侧边栏在左侧显示
        // 底部配置
        footer: {
            copyright: "",
        },
        // 设置搜索框的样式
        search: {
            provider: "local",
            options: {
                translations: {
                    button: {
                        buttonText: "搜索文档",
                        buttonAriaLabel: "搜索文档",
                    },
                    modal: {
                        noResultsText: "无法找到相关结果",
                        resetButtonTitle: "清除查询条件",
                        footer: {
                            selectText: "选择",
                            navigateText: "切换",
                        },
                    },
                },
            },
        },
    },
    // 配置markdown扩展
    markdown: {
        lineNumbers: true, // 开启代码块行号
    },
    mermaid: {
        // refer https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults for options
    },
    mermaidPlugin: {
        class: "mermaid my-class", // set additional css classes for parent container
    },
    vite: {
        plugins: [
            autoHomeWatchPlugin(),
            patchVPDocAsideWidth(),
            homeFeaturesPlugin(homeFeaturesMap),
            patchHomeFeaturesComponent(),
        ],
        resolve: {
            alias: [
                {
                    find: /vitepress[/\\]dist[/\\]client[/\\]theme-default[/\\]components[/\\]VPDoc\.vue$/,
                    replacement: customVPDoc,
                },
            ],
        },
    },
    transformPageData(pageData) {
        if (pageData.frontmatter?.layout !== "home") return;

        const sectionDir = path.dirname(pageData.filePath).replace(/\\/g, "/");
        if (!sectionDir || sectionDir === ".") return;

        const key = resolveHomeFeaturesKey(sectionDir, homeFeaturesMap);
        const features = homeFeaturesMap[key];
        if (!features?.length) return;

        pageData.frontmatter.features = features;
    },
});

