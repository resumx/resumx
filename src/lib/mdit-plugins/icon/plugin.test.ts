import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import MarkdownIt from 'markdown-it'
import {
	icon,
	iconifyResolver,
	createCustomResolver,
	type MarkdownItWithAsyncIcon,
} from './index.js'
import { iconCache } from './utils.js'

describe('icon plugin', () => {
	beforeEach(() => {
		iconCache.clear()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('renders cached icon via iconifyResolver', () => {
		iconCache.set('mdi/home', '<svg class="iconify">home</svg>')
		const md = new MarkdownIt().use(icon, {
			resolvers: [iconifyResolver],
		})
		expect(md.renderInline('hello :mdi/home: world')).toBe(
			'hello <svg class="iconify">home</svg> world',
		)
	})

	it('falls back to :name: when iconifyResolver has no cache entry', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [iconifyResolver],
		})
		expect(md.renderInline(':react:')).toBe(':react:')
	})

	it('uses resolvers in order; first non-null wins', () => {
		iconCache.set('mdi/home', '<svg class="iconify">home</svg>')
		const md = new MarkdownIt().use(icon, {
			resolvers: [
				createCustomResolver({ star: '<span class="star">★</span>' }),
				iconifyResolver,
			],
		})
		expect(md.renderInline(':star:')).toBe('<span class="star">★</span>')
		expect(md.renderInline(':mdi/home:')).toBe(
			'<svg class="iconify">home</svg>',
		)
	})

	it('falls back to :name: when no resolver matches', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [name => (name === 'known' ? '<b>known</b>' : null)],
		})
		expect(md.renderInline(':unknown:')).toBe(':unknown:')
	})

	it('works with no options (fallback only)', () => {
		const md = new MarkdownIt().use(icon)
		expect(md.renderInline(':foo:')).toBe(':foo:')
	})

	it('supports resolver object with render function', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [
				{
					render: (name: string) =>
						name === 'custom' ? '<span class="custom">ok</span>' : null,
				},
			],
		})
		expect(md.renderInline(':custom:')).toBe('<span class="custom">ok</span>')
	})

	it('renderInlineAsync prepares icons inside plugin', async () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [
				{
					render: (name: string) => iconCache.get(name),
					prepare: async (name: string) =>
						name === 'custom-async' ? '<svg class="iconify">ok</svg>' : null,
				},
			],
		})

		const html = await (
			md as typeof md & {
				renderInlineAsync: (src: string) => Promise<string>
			}
		).renderInlineAsync(':custom-async:')

		expect(html).toBe('<svg class="iconify">ok</svg>')
	})

	it('renderInlineAsync retries after offline failure', async () => {
		let online = false
		const md = new MarkdownIt().use(icon, {
			resolvers: [
				{
					render: (name: string) => iconCache.get(name),
					prepare: async (name: string) => {
						if (name !== 'retry-icon') return null
						return online ? '<svg class="iconify">retry</svg>' : null
					},
				},
			],
		})

		const first = await (
			md as typeof md & {
				renderInlineAsync: (src: string) => Promise<string>
			}
		).renderInlineAsync(':retry-icon:')
		expect(first).toBe(':retry-icon:')

		online = true
		const second = await (
			md as typeof md & {
				renderInlineAsync: (src: string) => Promise<string>
			}
		).renderInlineAsync(':retry-icon:')
		expect(second).toBe('<svg class="iconify">retry</svg>')
	})

	it('renderAsync processes env.icons into frontmatter overrides', async () => {
		const md = new MarkdownIt().use(icon) as MarkdownItWithAsyncIcon

		const html = await md.renderAsync(':myicon:', {
			iconOverrides: {
				myicon: '<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>',
			},
		})

		expect(html).toContain('<span class="icon">')
		expect(html).toContain('<svg')
	})

	it('env.icons override resolvers (highest priority)', async () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [createCustomResolver({ star: '<span>resolver</span>' })],
		}) as MarkdownItWithAsyncIcon

		const html = await md.renderAsync(':star:', {
			iconOverrides: {
				star: '<svg xmlns="http://www.w3.org/2000/svg"><rect class="fm"/></svg>',
			},
		})

		expect(html).toContain('fm')
		expect(html).not.toContain('resolver')
	})

	it('env.icons are scoped to single render (no leaking)', async () => {
		const md = new MarkdownIt().use(icon) as MarkdownItWithAsyncIcon

		await md.renderAsync(':myicon:', {
			iconOverrides: {
				myicon: '<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>',
			},
		})

		const html = await md.renderAsync(':myicon:')
		expect(html).toBe('<p>:myicon:</p>\n')
	})

	it('built-in function resolvers auto-prepare during renderInlineAsync', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					prefix: 'mdi',
					icons: {
						home: { body: '<path d="home"/>', width: 24, height: 24 },
					},
				}),
			}),
		)

		const md = new MarkdownIt().use(icon, {
			resolvers: [iconifyResolver],
		})

		const html = await (
			md as typeof md & {
				renderInlineAsync: (src: string) => Promise<string>
			}
		).renderInlineAsync(':mdi/home:')

		expect(html).toContain('<svg')
		expect(html).toContain('iconify')
	})
})
