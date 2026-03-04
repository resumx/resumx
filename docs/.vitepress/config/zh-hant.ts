import { defineConfig } from 'vitepress'

const sparkleIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.1em;margin-right:0.25em"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>'

export const zhHant = defineConfig({
	lang: 'zh-Hant',
	description: '面向開發者的 Markdown 履歷建構工具',
	themeConfig: {
		nav: [
			{ text: '指南', link: '/zh-hant/guide/quick-start' },
			{ text: '實戰手冊', link: '/zh-hant/playbook/resume-length' },
		],
		sidebar: {
			'/zh-hant/playbook/': [
				{
					items: [
						{
							text: '履歷篇幅',
							link: '/zh-hant/playbook/resume-length',
						},
						{
							text: '單欄 vs. 雙欄',
							link: '/zh-hant/playbook/one-column-vs-two-column',
						},
						{
							text: '客製 vs. 通用',
							link: '/zh-hant/playbook/tailored-vs-generic',
						},
						{
							text: '履歷措辭',
							link: '/zh-hant/playbook/resume-wording',
						},
						{
							text: '投遞時機',
							link: '/zh-hant/playbook/application-timing',
						},
					],
				},
			],
			'/zh-hant/': [
				{
					text: '起步',
					items: [
						{
							text: '什麼是 Resumx？',
							link: '/zh-hant/',
						},
						{
							text: '快速上手',
							link: '/zh-hant/guide/quick-start',
						},
						{
							text: `${sparkleIcon}使用 AI`,
							link: '/zh-hant/guide/using-ai',
						},
					],
				},
				{
					text: '撰寫履歷',
					items: [
						{
							text: 'Markdown 語法',
							link: '/zh-hant/guide/markdown-syntax',
						},
						{
							text: '類別與 ID',
							link: '/zh-hant/guide/classes-and-ids',
						},
						{ text: '圖示', link: '/zh-hant/guide/icons' },
						{
							text: '適配頁面',
							link: '/zh-hant/guide/fit-to-page',
						},
					],
				},
				{
					text: '針對性客製',
					items: [
						{
							text: '運作原理',
							link: '/zh-hant/guide/tailoring',
						},
						{ text: '標籤', link: '/zh-hant/guide/tags' },
						{ text: '視圖', link: '/zh-hant/guide/views' },
						{
							text: `${sparkleIcon}AI 客製工作流`,
							link: '/zh-hant/guide/ai-tailoring-workflows',
						},
					],
				},
				{
					text: '樣式',
					items: [
						{
							text: '自訂履歷樣式',
							link: '/zh-hant/guide/customizing-your-resume',
						},
						{
							text: '樣式選項',
							link: '/zh-hant/guide/style-options',
						},
						{
							text: 'Tailwind CSS',
							link: '/zh-hant/guide/tailwind-css',
						},
						{
							text: '自訂 CSS',
							link: '/zh-hant/guide/custom-css',
						},
					],
				},
				{
					text: '進階',
					items: [
						{
							text: '多語言',
							link: '/zh-hant/guide/multi-language',
						},
						{
							text: 'Git 整合',
							link: '/zh-hant/guide/git-integration',
						},
					],
				},
				{
					items: [
						{
							text: '語意化選擇器',
							link: '/zh-hant/guide/semantic-selectors',
						},
						{
							text: 'CLI 參考',
							link: '/zh-hant/guide/cli-reference',
						},
						{
							text: 'Frontmatter 參考',
							link: '/zh-hant/guide/frontmatter-reference',
						},
					],
				},
			],
		},
		docFooter: { prev: '上一頁', next: '下一頁' },
		outline: { label: '本頁目錄' },
		returnToTopLabel: '回到頂部',
		sidebarMenuLabel: '選單',
		darkModeSwitchLabel: '主題',
	},
})
