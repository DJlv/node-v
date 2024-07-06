import {comapnySiderBar} from "./companysSideBar.js"
export const sidebar = {
    // 当用户位于 `guide` 目录时，会显示此侧边栏
    '/docs/learn/java/': [ // java目录
        {
            text: 'java',
            items: [
                {
                    collapsed: false, text: '多线程', items: [
                        { text: '进程与线程', link: '/docs/learn/java/thread/process' },
                        { text: '线程', link: '/docs/learn/java/thread/thread' }
                    ]
                }
            ]
        }
    ],



    
    // company 不提交重新存储
    '/docs/company/ym/': comapnySiderBar.ym, 
    '/docs/company/cqrcb/': comapnySiderBar.cqrcb,
}