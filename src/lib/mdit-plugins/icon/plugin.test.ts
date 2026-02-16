import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import MarkdownIt from 'markdown-it'
import { icon, iconifyResolver, createCustomResolver } from './index.js'
import { iconCache } from './utils.js'

describe('icon plugin', () => {
	beforeEach(() => {
		iconCache.clear()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('renders cached icon via iconifyResolver', () => {
		iconCache.set('mdi:home', '<svg class="iconify">home</svg>')
		const md = new MarkdownIt().use(icon, {
			resolvers: [iconifyResolver],
		})
		expect(md.renderInline('hello ::mdi:home:: world')).toBe(
			'hello <svg class="iconify">home</svg> world',
		)
	})

	it('falls back to ::name:: when iconifyResolver has no cache entry', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [iconifyResolver],
		})
		// No cache entry for react - falls through to fallback
		expect(md.renderInline('::react::')).toBe('::react::')
	})

	it('uses resolvers in order; first non-null wins', () => {
		iconCache.set('mdi:home', '<svg class="iconify">home</svg>')
		const md = new MarkdownIt().use(icon, {
			resolvers: [
				createCustomResolver({ star: '<span class="star">★</span>' }),
				iconifyResolver,
			],
		})
		expect(md.renderInline('::star::')).toBe('<span class="star">★</span>')
		expect(md.renderInline('::mdi:home::')).toBe(
			'<svg class="iconify">home</svg>',
		)
	})

	it('falls back to ::name:: when no resolver matches', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [name => (name === 'known' ? '<b>known</b>' : null)],
		})
		expect(md.renderInline('::unknown::')).toBe('::unknown::')
	})

	it('dangerous icon names are escaped in fallback', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [name => (name === 'safe' ? '<b>safe</b>' : null)],
		})
		expect(md.renderInline('::<img src=x onerror=alert(1)>::')).toBe(
			'::&lt;img src=x onerror=alert(1)&gt;::',
		)
	})

	it('works with no options (fallback only)', () => {
		const md = new MarkdownIt().use(icon)
		expect(md.renderInline('::foo::')).toBe('::foo::')
	})

	it('preserves :::text::: as literal (reserved syntax for future use)', () => {
		const md = new MarkdownIt().use(icon, { resolvers: [iconifyResolver] })
		expect(md.renderInline(':::three:::')).toBe(':::three:::')
		expect(md.renderInline('before :::badge::: after')).toBe(
			'before :::badge::: after',
		)
	})

	it.each([4, 5, 6, 7, 8, 9, 10])(
		'preserves %s colons each side as literal',
		n => {
			const md = new MarkdownIt().use(icon, {
				resolvers: [iconifyResolver],
			})
			const delims = ':'.repeat(n)
			const src = `${delims}test${delims}`
			expect(md.renderInline(src)).toBe(src)
		},
	)

	it('supports resolver object with render function', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [
				{
					render: (name: string) =>
						name === 'custom' ? '<span class="custom">ok</span>' : null,
				},
			],
		})
		expect(md.renderInline('::custom::')).toBe('<span class="custom">ok</span>')
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
		).renderInlineAsync('::custom-async::')

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
		).renderInlineAsync('::retry-icon::')
		expect(first).toBe('::retry-icon::')

		online = true
		const second = await (
			md as typeof md & {
				renderInlineAsync: (src: string) => Promise<string>
			}
		).renderInlineAsync('::retry-icon::')
		expect(second).toBe('<svg class="iconify">retry</svg>')
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
		).renderInlineAsync('::mdi:home::')

		expect(html).toContain('<svg')
		expect(html).toContain('iconify')
	})
})
