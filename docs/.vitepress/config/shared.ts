import { defineConfig } from 'vitepress'
import {
	transformerNotationWordHighlight,
	transformerMetaWordHighlight,
} from '@shikijs/transformers'
import { transformerResumxSyntax } from '../theme/transformerResumxSyntax'

export const shared = defineConfig({
	title: 'Resumx',
	head: [
		[
			'link',
			{
				rel: 'icon',
				type: 'image/png',
				sizes: '96x96',
				href: '/favicon-96x96.png',
			},
		],
		['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
		['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
		[
			'link',
			{
				rel: 'apple-touch-icon',
				sizes: '180x180',
				href: '/apple-touch-icon.png',
			},
		],
		['meta', { name: 'apple-mobile-web-app-title', content: 'Resumx' }],
		['link', { rel: 'manifest', href: '/site.webmanifest' }],
		['meta', { property: 'og:type', content: 'website' }],
		[
			'meta',
			{ property: 'og:image', content: 'https://resumx.dev/og-image.png' },
		],
		['meta', { property: 'og:image:width', content: '1200' }],
		['meta', { property: 'og:image:height', content: '630' }],
		['meta', { property: 'og:image:type', content: 'image/png' }],
		['meta', { name: 'twitter:card', content: 'summary_large_image' }],
		[
			'meta',
			{ name: 'twitter:image', content: 'https://resumx.dev/og-image.png' },
		],
	],
	rewrites: {
		'guide/what-is-resumx.md': 'index.md',
	},
	markdown: {
		codeTransformers: [
			transformerNotationWordHighlight(),
			transformerMetaWordHighlight(),
			transformerResumxSyntax(),
		],
	},
	themeConfig: {
		logo: {
			light: '/images/resumx-wordmark-light.svg',
			dark: '/images/resumx-wordmark-dark.svg',
		},
		siteTitle: false,
		search: {
			provider: 'local',
		},
		socialLinks: [{ icon: 'github', link: 'https://github.com/resumx/resumx' }],
	},
})
