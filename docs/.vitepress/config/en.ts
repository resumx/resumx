import { defineConfig } from 'vitepress'

const sparkleIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.1em;margin-right:0.25em"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>'

const gitIcon =
	'<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" style="display:inline-block;vertical-align:-0.1em;margin-right:0.25em"><path fill="currentColor" d="M23.546 10.93L13.067.452a1.55 1.55 0 0 0-2.188 0L8.708 2.627l2.76 2.76a1.838 1.838 0 0 1 2.327 2.341l2.658 2.66a1.838 1.838 0 0 1 1.9 3.039a1.837 1.837 0 0 1-2.6 0a1.85 1.85 0 0 1-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348a1.85 1.85 0 0 1 0 2.6a1.844 1.844 0 0 1-2.609 0a1.834 1.834 0 0 1 0-2.598c.182-.18.387-.316.605-.406V8.835a1.834 1.834 0 0 1-.996-2.41L7.636 3.7L.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477a1.545 1.545 0 0 0 2.186 0l10.43-10.43a1.544 1.544 0 0 0 0-2.187" /></svg>'

export const en = defineConfig({
	lang: 'en',
	description: 'Markdown-first resume builder for developers',
	themeConfig: {
		nav: [
			{ text: 'Guide', link: '/guide/quick-start', activeMatch: '^/guide/' },
			{ text: 'Playground', link: '/playground' },
		],
		sidebar: {
			'/playbook/': [
				{
					items: [
						{
							text: 'Resume Length',
							link: '/playbook/resume-length',
						},
						{
							text: 'One vs. Two Columns',
							link: '/playbook/one-column-vs-two-column',
						},
						{
							text: 'Tailored vs. Generic',
							link: '/playbook/tailored-vs-generic',
						},
						{
							text: 'Resume Wording',
							link: '/playbook/resume-wording',
						},
						{
							text: 'Application Timing',
							link: '/playbook/application-timing',
						},
					],
				},
			],
			'/': [
				{
					text: 'Essentials',
					items: [
						{ text: 'Quick Start', link: '/guide/quick-start' },
						{ text: 'Syntax', link: '/guide/syntax' },
						{ text: 'Fit to Page', link: '/guide/fit-to-page' },
					],
				},
				{
					text: 'Styling',
					items: [
						{
							text: 'Customizing Your Resume',
							link: '/guide/customizing-your-resume',
						},
						{ text: 'Icons', link: '/guide/icons' },
						{
							text: 'Style Options',
							link: '/guide/style-options',
						},
						{
							text: 'Tailwind CSS',
							link: '/guide/tailwind-css',
						},
						{ text: 'Custom CSS', link: '/guide/custom-css' },
					],
				},
				{
					text: 'Tailoring',
					items: [
						{
							text: 'How It Works',
							link: '/guide/tailoring',
						},
						{ text: 'Tags', link: '/guide/tags' },
						{ text: 'Views', link: '/guide/views' },
						{
							text: `${sparkleIcon}AI Tailoring Workflows`,
							link: '/guide/ai-tailoring-workflows',
						},
						{
							text: 'Multi-Language',
							link: '/guide/multi-language',
						},
					],
				},
				{
					text: 'References',
					items: [
						{
							text: 'Semantic Selectors',
							link: '/guide/semantic-selectors',
						},
						{
							text: 'CLI Reference',
							link: '/guide/cli-reference',
						},
						{
							text: 'Frontmatter Reference',
							link: '/guide/frontmatter-reference',
						},
						{
							text: 'Telemetry',
							link: '/guide/telemetry',
						},
					],
				},
			],
		},
	},
})
