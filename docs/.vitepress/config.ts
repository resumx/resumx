import { defineConfig } from 'vitepress'
import {
	transformerNotationWordHighlight,
	transformerMetaWordHighlight,
} from '@shikijs/transformers'
import { transformerResumxSyntax } from './theme/transformerResumxSyntax'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	base: '/guide/',
	title: 'Resumx',
	description: 'Markdown-first resume builder for developers',
	head: [
		['link', { rel: 'icon', type: 'image/png', href: '/guide/favicon.png' }],
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
		nav: [{ text: 'Guide', link: '/' }],

		sidebar: [
			{
				text: 'Getting Started',
				items: [
					{ text: 'What is Resumx?', link: '/' },
					{ text: 'The Resumx Approach', link: '/the-resumx-approach' },
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
					{ text: 'Per-Role Output', link: '/per-role-output' },
					{ text: 'Multi-Language', link: '/multi-language' },
					{
						text: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" style="display:inline-block;vertical-align:-0.1em;margin-right:0.25em"><path fill="currentColor" d="M15.698 7.287L8.712.302a1.03 1.03 0 0 0-1.457 0l-1.45 1.45l1.84 1.84a1.223 1.223 0 0 1 1.55 1.56l1.773 1.774a1.224 1.224 0 0 1 1.267 2.025a1.226 1.226 0 0 1-2.001-1.334L8.579 5.963v4.353q.177.085.324.231a1.226 1.226 0 1 1-1.332-.267V5.887a1.226 1.226 0 0 1-.666-1.608L5.093 2.465l-4.79 4.79a1.03 1.03 0 0 0 0 1.457l6.986 6.986a1.03 1.03 0 0 0 1.457 0l6.953-6.953a1.03 1.03 0 0 0 0-1.458"/></svg>Git Superpowers',
						link: '/git-superpowers',
					},
				],
			},
			{
				text: 'Styling',
				items: [
					{ text: 'Fit to Page', link: '/fit-to-page' },
					{ text: 'Themes', link: '/themes' },
					{ text: 'Tailwind CSS', link: '/tailwind-css' },
					{ text: 'Custom CSS', link: '/custom-css' },
					{ text: 'Semantic Selectors', link: '/semantic-selectors' },
				],
			},
			{
				items: [
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
