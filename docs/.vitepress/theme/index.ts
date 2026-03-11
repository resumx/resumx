// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { inject } from '@vercel/analytics'
import posthog from 'posthog-js'
import type Lenis from 'lenis'
import './style.css'
import SidebarGroupLabel from './SidebarGroupLabel.vue'
import DocActions from './DocActions.vue'
import IconGallery from './IconGallery.vue'
import ResumeDemo from './ResumeDemo.vue'
import TagLineage from './TagLineage.vue'
import HeroLanding from './components/ui/HeroLanding.vue'
import NavBarTitleA11y from './NavBarTitleA11y.vue'

export default {
	extends: DefaultTheme,
	Layout: () => {
		return h(DefaultTheme.Layout, null, {
			// https://vitepress.dev/guide/extending-default-theme#layout-slots
			'doc-before': () => [h(DocActions), h(SidebarGroupLabel)],
			'nav-bar-title-after': () => h(NavBarTitleA11y),
		})
	},
	enhanceApp({ app, router, siteData }) {
		if (typeof window !== 'undefined') {
			inject()
			posthog.init('phc_DpX1MLcKPymhdbhrwIwgLBB6ymLPkBLGS2srLrcmqUE', {
				api_host: 'https://us.i.posthog.com',
				capture_pageview: false,
			})
			let lenisInstance: Lenis | null = null
			const getPath = () =>
				(typeof window !== 'undefined' && window.location.pathname) || '/'
			const syncLenis = () => {
				const path = getPath().replace(/\/$/, '') || '/'
				const isHome = path === '/' || path === ''
				if (isHome && !lenisInstance) {
					import('lenis').then(({ default: LenisClass }) => {
						const nowPath = getPath().replace(/\/$/, '') || '/'
						if (nowPath !== '/') return
						if (lenisInstance) return
						import('lenis/dist/lenis.css')
						lenisInstance = new LenisClass({
							autoRaf: true,
							anchors: true,
						})
					})
				} else if (!isHome && lenisInstance) {
					lenisInstance.destroy()
					lenisInstance = null
				}
			}
			syncLenis()
			router.onAfterRouteChange = () => {
				syncLenis()
				posthog.capture('$pageview')
			}
		}
		app.component('IconGallery', IconGallery)
		app.component('ResumeDemo', ResumeDemo)
		app.component('TagLineage', TagLineage)
		app.component('HeroLanding', HeroLanding)
	},
} satisfies Theme
