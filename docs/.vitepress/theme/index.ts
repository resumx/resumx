// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import SidebarGroupLabel from './SidebarGroupLabel.vue'
import DocActions from './DocActions.vue'
import IconGallery from './IconGallery.vue'
import ResumeDemo from './ResumeDemo.vue'
import TagLineage from './TagLineage.vue'

export default {
	extends: DefaultTheme,
	Layout: () => {
		return h(DefaultTheme.Layout, null, {
			// https://vitepress.dev/guide/extending-default-theme#layout-slots
			'doc-before': () => [h(DocActions), h(SidebarGroupLabel)],
		})
	},
	enhanceApp({ app, router, siteData }) {
		app.component('IconGallery', IconGallery)
		app.component('ResumeDemo', ResumeDemo)
		app.component('TagLineage', TagLineage)
	},
} satisfies Theme
