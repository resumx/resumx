import { defineConfig } from 'vitepress'
import {
	transformerNotationWordHighlight,
	transformerMetaWordHighlight,
} from '@shikijs/transformers'
import { transformerResumxSyntax } from './theme/transformerResumxSyntax'

const guideSidebar = [
	{
		text: 'Getting Started',
		items: [
			{ text: 'What is Resumx?', link: '/' },
			{ text: 'Quick Start', link: '/guide/quick-start' },
			{
				text: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.1em;margin-right:0.25em"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>Using AI',
				link: '/guide/using-ai',
			},
		],
	},
	{
		text: 'Writing Your Resume',
		items: [
			{ text: 'Markdown Syntax', link: '/guide/markdown-syntax' },
			{ text: 'Classes & IDs', link: '/guide/classes-and-ids' },
			{ text: 'Icons', link: '/guide/icons' },
			{ text: 'Fit to Page', link: '/guide/fit-to-page' },
		],
	},
	{
		text: 'Tailoring',
		items: [
			{ text: 'How It Works', link: '/guide/tailoring' },
			{ text: 'Tags', link: '/guide/tags' },
			{ text: 'Views', link: '/guide/views' },
			{
				text: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.1em;margin-right:0.25em"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>AI Tailoring Workflows',
				link: '/guide/ai-tailoring-workflows',
			},
		],
	},
	{
		text: 'Styling',
		items: [
			{
				text: 'Customizing Your Resume',
				link: '/guide/customizing-your-resume',
			},
			{ text: 'Style Options', link: '/guide/style-options' },
			{ text: 'Tailwind CSS', link: '/guide/tailwind-css' },
			{ text: 'Custom CSS', link: '/guide/custom-css' },
		],
	},
	{
		text: 'Going Further',
		items: [
			{ text: 'Multi-Language', link: '/guide/multi-language' },
			{ text: 'Git Integration', link: '/guide/git-integration' },
			{ text: 'Vercel Analytics', link: '/guide/vercel-analytics' },
		],
	},
	{
		items: [
			{ text: 'Semantic Selectors', link: '/guide/semantic-selectors' },
			{ text: 'CLI Reference', link: '/guide/cli-reference' },
			{
				text: 'Frontmatter Reference',
				link: '/guide/frontmatter-reference',
			},
		],
	},
]

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
		// https://vitepress.dev/reference/default-theme-config
		logo: {
			light: '/images/resumx-wordmark-light.svg',
			dark: '/images/resumx-wordmark-dark.svg',
		},
		siteTitle: false,
		nav: [
			{ text: 'Guide', link: '/guide/quick-start' },
			{ text: 'Playbook', link: '/playbook/resume-length' },
		],

		sidebar: {
			'/playbook/': [
				{
					items: [
						{ text: 'Resume Length', link: '/playbook/resume-length' },
						{
							text: 'One vs. Two Columns',
							link: '/playbook/one-column-vs-two-column',
						},
						{
							text: 'Tailored vs. Generic',
							link: '/playbook/tailored-vs-generic',
						},
						{ text: 'Resume Wording', link: '/playbook/resume-wording' },
						{
							text: 'Application Timing',
							link: '/playbook/application-timing',
						},
					],
				},
			],
			'/': guideSidebar,
		},

		search: {
			provider: 'local',
		},

		socialLinks: [{ icon: 'github', link: 'https://github.com/resumx/resumx' }],
	},
})
