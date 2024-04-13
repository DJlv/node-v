import { defineConfig } from "vitepress";
import { set_sidebar } from "../utils/auto-gen-sidebar.mjs";
import { withMermaid } from "vitepress-plugin-mermaid";

// import markdownItAnchor from "markdown-it-anchor";
// import MarkdownIt from "markdown-it";
// import { tocPlugin } from "@mdit-vue/plugin-toc";

// 目前有两个问题没搞懂，一个是配置了srcDir以后，我的style.css样式不生效了。第二个是markdown扩展插件到底怎么用的啊

// https://vitepress.dev/reference/site-config
export default withMermaid({
  base:'/node-v/',
  head: [["link", { rel: "icon", href: "/logo.svg" }]],
  title: "文档网站",
  description: "",
  themeConfig: {
    outlineTitle: "文章目录",
    outline: [2, 6],
    // outline: "deep",
    // https://vitepress.dev/reference/default-theme-config
    logo: "logo.svg", // 配置logo位置，public目录
    // 顶部导航栏配置
    nav: [
      {
        text: "工程",
        items: [
          { text: "dummy", link: "/docs/dummy/index" }
        ]
      },
      { text: "工具",link: "/docs/address/index" }
    ],



    navbar: true, //开启导航栏，我设置成false也没啥用不知道为啥
    sidebar: false, // 关闭侧边栏
    lastUpdated: true, // 显示上次修改时间
    aside: "left", // 设置右侧侧边栏在左侧显示
    // 社交链接，内置的都是国外的，国内只能通过svg设置
    socialLinks: [
      { icon: "github", link: "https://github.com/DJlv" },
      {icon: "twitter",link: "https://vitepress.dev/zh/guide/what-is-vitepress"}
    ],
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
    // options for markdown-it-anchor
    // https://github.com/valeriangalliat/markdown-it-anchor#usage
    // anchor: {
    //   permalink: markdownItAnchor.permalink.headerLink(),
    // },

    // // options for @mdit-vue/plugin-toc
    // // https://github.com/mdit-vue/mdit-vue/tree/main/packages/plugin-toc#options
    // toc: { level: [2, 3] },
    // config: (md) => {
    //   // use more markdown-it plugins!
    //   md.use(tocPlugin);
    // },
  },
  mermaid: {
    // refer https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults for options
  },
  mermaidPlugin: {
    class: "mermaid my-class", // set additional css classes for parent container
  },
});
