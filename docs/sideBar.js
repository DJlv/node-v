import {javaOther, projectOther} from "./allOther.js"


export const navbar = [
    {text: '学习笔记', link: '/docs/learn/index'},
    {text: '项目', link: '/docs/project/index'},
    {text: '工具文档', link: '/docs/address/index'},
    {text: "其他", link: "/docs/company/index"}
]

export const sidebar = {
    '/docs/learn/java/': javaOther, // java目录
    '/docs/project/java/': projectOther, // java目录
}

