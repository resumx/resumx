import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { icon, iconifyResolver, createCustomResolver } from './index.js'

describe('icon plugin', () => {
	it('registers parser and renderer; renders ::icon-name:: end-to-end with iconify', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [iconifyResolver],
		})
		expect(md.renderInline('hello ::mdi:home:: world')).toBe(
			'hello <span class="iconify" data-icon="mdi:home" style="display: inline-block;"></span> world',
		)
	})

	it('iconify renders all icon names (valid or not)', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [iconifyResolver],
		})
		// Iconify will render any name, even if it's not a valid iconify icon
		expect(md.renderInline('::react::')).toBe(
			'<span class="iconify" data-icon="react" style="display: inline-block;"></span>',
		)
	})

	it('uses resolvers in order; first non-null wins', () => {
		const md = new MarkdownIt().use(icon, {
			resolvers: [
				createCustomResolver({ star: '<span class="star">★</span>' }),
				iconifyResolver,
			],
		})
		expect(md.renderInline('::star::')).toBe('<span class="star">★</span>')
		expect(md.renderInline('::mdi:home::')).toBe(
			'<span class="iconify" data-icon="mdi:home" style="display: inline-block;"></span>',
		)
		expect(md.renderInline('::react::')).toBe(
			'<span class="iconify" data-icon="react" style="display: inline-block;"></span>',
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
			const md = new MarkdownIt().use(icon, { resolvers: [iconifyResolver] })
			const delims = ':'.repeat(n)
			const src = `${delims}test${delims}`
			expect(md.renderInline(src)).toBe(src)
		},
	)
})
