import { defineConfig } from 'vitepress'
import {
	transformerNotationWordHighlight,
	transformerMetaWordHighlight,
} from '@shikijs/transformers'
import { transformerResumxSyntax } from './theme/transformerResumxSyntax'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'Resumx',
	description: 'Markdown-first resume builder for developers',
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
	],
	rewrites: {
		'what-is-resumx.md': 'index.md',
	},
	markdown: {
		codeTransformers: [
			transformerNotationWordHighlight(),
			transformerMetaWordHighlight(),
			transformerResumxSyntax(),
		],
	},
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		logo: {
			light: '/images/resumx-wordmark-light.svg',
			dark: '/images/resumx-wordmark-dark.svg',
		},
		siteTitle: false,
		nav: [{ text: 'Guide', link: '/' }],

		sidebar: [
			{
				text: 'Getting Started',
				items: [
					{ text: 'What is Resumx?', link: '/' },
					{ text: 'Quick Start', link: '/quick-start' },
					{
						text: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.1em;margin-right:0.25em"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>Using AI',
						link: '/using-ai',
					},
				],
			},
			{
				text: 'Writing Your Resume',
				items: [
					{ text: 'Markdown Syntax', link: '/markdown-syntax' },
					{ text: 'Classes & IDs', link: '/classes-and-ids' },
					{ text: 'Icons', link: '/icons' },
					{ text: 'Fit to Page', link: '/fit-to-page' },
				],
			},
			{
				text: 'Styling',
				items: [
					{ text: 'Customizing Your Resume', link: '/customizing-your-resume' },
					{ text: 'Themes', link: '/themes' },
					{ text: 'Tailwind CSS', link: '/tailwind-css' },
					{ text: 'Custom CSS', link: '/custom-css' },
				],
			},
			{
				text: 'Going Further',
				items: [
					{ text: 'Per-Role Output', link: '/per-role-output' },
					{ text: 'Multi-Language', link: '/multi-language' },
					{ text: 'Git Integration', link: '/git-integration' },
				],
			},
			{
				items: [
					{ text: 'Semantic Selectors', link: '/semantic-selectors' },
					{ text: 'CLI Reference', link: '/cli-reference' },
					{ text: 'Frontmatter Reference', link: '/frontmatter-reference' },
				],
			},
		],

		search: {
			provider: 'local',
		},

		socialLinks: [{ icon: 'github', link: 'https://github.com/ocmrz/resumx' }],
	},
})
