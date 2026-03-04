import { defineConfig } from 'vitepress'
import { shared } from './shared'
import { en } from './en'
import { zhCN } from './zh-cn'
import { zhHant } from './zh-hant'

export default defineConfig({
	...shared,
	locales: {
		root: { label: 'English', ...en },
		'zh-cn': { label: '简体中文', ...zhCN },
		'zh-hant': { label: '繁體中文', ...zhHant },
	},
})
