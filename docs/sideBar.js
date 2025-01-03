import { set_sidebar } from "../utils/auto-gen-sidebar.mjs";
import {javaOther, projectOther} from "./allOther.js"

const learn = "/docs/learn/"
const project = "/docs/project/"
const address = "/docs/address/"
const other = "/docs/other/"

export const navbar = [
    {text: '学习笔记', link: learn+'index'},
    {text: '项目', link:  project+'index'},
    {text: '工具文档', link:  address+'index'},
    {text: "其他", link:  other+'index'}
]

export const sidebar = {
    '/docs/learn/java/': set_sidebar("/docs/learn/java/"),
    '/docs/project/': set_sidebar("/docs/project/") // java目录
}

