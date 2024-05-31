import {withMermaid} from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid({
    base: '/node-v/',
    head: [["link", {rel: "icon", href: "/logo.svg"}]],
    title: "文档网站",
    description: "",
    themeConfig: {
        outlineTitle: "文章目录",
        outline: [1, 6],
        // 顶部导航栏配置
        nav: [
            {text: '学习笔记', link: '/docs/learn/index'},
            {text: '工程', link: '/docs/project/index'},
            {text: '工具文档', link: '/docs/address/index'},
            {text: "其他", link: "/docs/company/index"}
        ],
        // sidebar: {
        //     '/docs/dummy/dummy': [{text: "dummy", link: "/docs/dummy/dummy"}]
        // },
        socialLinks: [
            {icon: "github", link: "https://github.com/DJlv"},
            {icon: "twitter", link: "https://vitepress.dev/zh/guide/what-is-vitepress"}
        ],
        navbar: true, //开启导航栏，我设置成false也没啥用不知道为啥
        sidebar: false, // 关闭侧边栏
        lastUpdated: true, // 显示上次修改时间
        aside: "left", // 设置右侧侧边栏在左侧显示
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
});
