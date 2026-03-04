import { defineConfig } from 'vitepress'

const sparkleIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.1em;margin-right:0.25em"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>'

export const zhCN = defineConfig({
	lang: 'zh-CN',
	description: '面向开发者的 Markdown 简历构建工具',
	themeConfig: {
		nav: [
			{ text: '指南', link: '/zh-cn/guide/quick-start' },
			{ text: '实战手册', link: '/zh-cn/playbook/resume-length' },
		],
		sidebar: {
			'/zh-cn/playbook/': [
				{
					items: [
						{
							text: '简历篇幅',
							link: '/zh-cn/playbook/resume-length',
						},
						{
							text: '单栏 vs. 双栏',
							link: '/zh-cn/playbook/one-column-vs-two-column',
						},
						{
							text: '定制 vs. 通用',
							link: '/zh-cn/playbook/tailored-vs-generic',
						},
						{
							text: '简历措辞',
							link: '/zh-cn/playbook/resume-wording',
						},
						{
							text: '投递时机',
							link: '/zh-cn/playbook/application-timing',
						},
					],
				},
			],
			'/zh-cn/': [
				{
					text: '起步',
					items: [
						{
							text: '什么是 Resumx？',
							link: '/zh-cn/',
						},
						{
							text: '快速上手',
							link: '/zh-cn/guide/quick-start',
						},
						{
							text: `${sparkleIcon}使用 AI`,
							link: '/zh-cn/guide/using-ai',
						},
					],
				},
				{
					text: '撰写简历',
					items: [
						{
							text: 'Markdown 语法',
							link: '/zh-cn/guide/markdown-syntax',
						},
						{
							text: '类名与 ID',
							link: '/zh-cn/guide/classes-and-ids',
						},
						{ text: '图标', link: '/zh-cn/guide/icons' },
						{
							text: '适配页面',
							link: '/zh-cn/guide/fit-to-page',
						},
					],
				},
				{
					text: '针对性定制',
					items: [
						{
							text: '工作原理',
							link: '/zh-cn/guide/tailoring',
						},
						{ text: '标签', link: '/zh-cn/guide/tags' },
						{ text: '视图', link: '/zh-cn/guide/views' },
						{
							text: `${sparkleIcon}AI 定制工作流`,
							link: '/zh-cn/guide/ai-tailoring-workflows',
						},
					],
				},
				{
					text: '样式',
					items: [
						{
							text: '自定义简历样式',
							link: '/zh-cn/guide/customizing-your-resume',
						},
						{
							text: '样式选项',
							link: '/zh-cn/guide/style-options',
						},
						{
							text: 'Tailwind CSS',
							link: '/zh-cn/guide/tailwind-css',
						},
						{
							text: '自定义 CSS',
							link: '/zh-cn/guide/custom-css',
						},
					],
				},
				{
					text: '进阶',
					items: [
						{
							text: '多语言',
							link: '/zh-cn/guide/multi-language',
						},
						{
							text: 'Git 集成',
							link: '/zh-cn/guide/git-integration',
						},
					],
				},
				{
					items: [
						{
							text: '语义化选择器',
							link: '/zh-cn/guide/semantic-selectors',
						},
						{
							text: 'CLI 参考',
							link: '/zh-cn/guide/cli-reference',
						},
						{
							text: 'Frontmatter 参考',
							link: '/zh-cn/guide/frontmatter-reference',
						},
					],
				},
			],
		},
		docFooter: { prev: '上一页', next: '下一页' },
		outline: { label: '本页目录' },
		returnToTopLabel: '回到顶部',
		sidebarMenuLabel: '菜单',
		darkModeSwitchLabel: '主题',
	},
})
