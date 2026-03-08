import { defineConfig } from 'vitepress'
import { shared } from './shared'
import { en } from './en'

export default defineConfig({
	...shared,
	locales: {
		root: { label: 'English', ...en },
	},
})
