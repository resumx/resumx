import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { icon, iconifyRender, createCustomResolver } from './index.js'

describe('icon plugin', () => {
	it('registers parser and renderer; renders ::icon-name:: end-to-end with iconify', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [iconifyRender],
		})
		expect(md.renderInline('hello ::mdi:home:: world')).toBe(
			'hello <iconify-icon icon="mdi:home" style="vertical-align: -0.125em; display: inline-block;"></iconify-icon> world',
		)
	})

	it('iconify renders all icon names (valid or not)', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [iconifyRender],
		})
		// Iconify will render any name, even if it's not a valid iconify icon
		expect(md.renderInline('::react::')).toBe(
			'<iconify-icon icon="react" style="vertical-align: -0.125em; display: inline-block;"></iconify-icon>',
		)
	})

	it('uses resolvers in order; first non-null wins', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [
				createCustomResolver({ star: '<span class="star">★</span>' }),
				iconifyRender,
			],
		})
		expect(md.renderInline('::star::')).toBe('<span class="star">★</span>')
		expect(md.renderInline('::mdi:home::')).toBe(
			'<iconify-icon icon="mdi:home" style="vertical-align: -0.125em; display: inline-block;"></iconify-icon>',
		)
		expect(md.renderInline('::react::')).toBe(
			'<iconify-icon icon="react" style="vertical-align: -0.125em; display: inline-block;"></iconify-icon>',
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
		const md = new MarkdownIt().use(icon, { resolvers: [iconifyRender] })
		expect(md.renderInline(':::three:::')).toBe(':::three:::')
		expect(md.renderInline('before :::badge::: after')).toBe(
			'before :::badge::: after',
		)
	})

	it.each([4, 5, 6, 7, 8, 9, 10])(
		'preserves %s colons each side as literal',
		n => {
			const md = new MarkdownIt().use(icon, { resolvers: [iconifyRender] })
			const delims = ':'.repeat(n)
			const src = `${delims}test${delims}`
			expect(md.renderInline(src)).toBe(src)
		},
	)
})
