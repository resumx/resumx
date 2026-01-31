import { describe, it, expect } from 'vitest'
import {
	iconifyResolver,
	createCustomResolver,
	resumxIconResolver,
} from './index.js'
import { buildRender, createIconRenderRule } from './renderer.js'

describe('buildRender', () => {
	it('tries resolvers in order; first non-null wins', () => {
		const render = buildRender({
			resolvers: [
				createCustomResolver({ star: '<span class="star">★</span>' }),
				iconifyResolver,
			],
		})
		expect(render('star')).toBe('<span class="star">★</span>')
		expect(render('mdi:home')).toBe(
			'<iconify-icon icon="mdi:home" style="vertical-align: -0.125em; display: inline-block;"></iconify-icon>',
		)
		expect(render('react')).toBe(
			'<iconify-icon icon="react" style="vertical-align: -0.125em; display: inline-block;"></iconify-icon>',
		)
	})

	it('falls back to ::name:: when no resolver matches', () => {
		const render = buildRender({
			resolvers: [name => (name === 'known' ? '<b>known</b>' : null)],
		})
		expect(render('unknown')).toBe('::unknown::')
	})

	it('falls back to ::name:: when no options provided', () => {
		const render = buildRender({})
		expect(render('any')).toBe('::any::')
	})

	it('escapes dangerous names in fallback', () => {
		const render = buildRender({})
		expect(render('foo<script>alert(1)</script>')).toBe(
			'::foo&lt;script&gt;alert(1)&lt;/script&gt;::',
		)
		expect(render('a&quot;b&c')).toBe('::a&amp;quot;b&amp;c::')
	})
})

describe('createIconRenderRule', () => {
	it('calls render with token content at idx', () => {
		const render = (content: string) => `<x>${content}</x>`
		const rule = createIconRenderRule(render)
		const tokens = [{ content: 'foo' }, { content: 'bar' }]
		expect(rule(tokens, 0)).toBe('<x>foo</x>')
		expect(rule(tokens, 1)).toBe('<x>bar</x>')
	})

	it('uses empty string when token has no content', () => {
		const render = (content: string) => `[${content}]`
		const rule = createIconRenderRule(render)
		expect(rule([{}], 0)).toBe('[]')
	})
})

describe('iconifyResolver', () => {
	it('renders with alignment styles', () => {
		expect(iconifyResolver('mdi:home')).toBe(
			'<iconify-icon icon="mdi:home" style="vertical-align: -0.125em; display: inline-block;"></iconify-icon>',
		)
	})

	it('escapes HTML in icon name', () => {
		expect(iconifyResolver('mdi:foo<script>')).toBe(
			'<iconify-icon icon="mdi:foo&lt;script&gt;" style="vertical-align: -0.125em; display: inline-block;"></iconify-icon>',
		)
	})

	it('escapes " in icon name', () => {
		expect(iconifyResolver('mdi:foo" onclick="alert(1)')).toBe(
			'<iconify-icon icon="mdi:foo&quot; onclick=&quot;alert(1)" style="vertical-align: -0.125em; display: inline-block;"></iconify-icon>',
		)
	})
})

describe('createCustomResolver', () => {
	it('returns map value for trimmed name or null', () => {
		const resolve = createCustomResolver({ star: '<star/>' })
		expect(resolve('star')).toBe('<star/>')
		expect(resolve('  star  ')).toBe('<star/>')
		expect(resolve('other')).toBeNull()
	})
})

describe('resumxIconResolver', () => {
	it('resolves devicon names to HTML with devicon: prefix', () => {
		const html = resumxIconResolver('react')
		expect(html).toContain('devicon:react')
		expect(html).toContain('iconify-icon')
	})

	it('uses override for aws (amazonwebservices)', () => {
		const html = resumxIconResolver('aws')
		expect(html).toContain('devicon:amazonwebservices')
	})

	it('uses override for nodejs (logos set)', () => {
		const html = resumxIconResolver('nodejs')
		expect(html).toContain('logos:nodejs-icon')
	})

	it('returns null for unknown name', () => {
		expect(resumxIconResolver('unknown-icon-name')).toBeNull()
	})
})
