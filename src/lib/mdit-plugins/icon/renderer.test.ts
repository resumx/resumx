import { describe, it, expect, beforeEach } from 'vitest'
import {
	iconifyResolver,
	createCustomResolver,
	wikiCommonsResolver,
	githubResolver,
} from './index.js'
import { iconCache } from './utils.js'
import { buildRender, createIconRenderRule } from './renderer.js'

describe('buildRender', () => {
	it('tries resolvers in order; first non-null wins', () => {
		const render = buildRender({
			resolvers: [
				createCustomResolver({ star: '<span class="star">★</span>' }),
			],
		})
		expect(render('star')).toBe('<span class="star">★</span>')
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

	it('iconifyResolver returns cached SVG when cache is primed', () => {
		iconCache.set('mdi:home', '<svg class="iconify">home</svg>')
		const render = buildRender({
			resolvers: [iconifyResolver],
		})
		expect(render('mdi:home')).toBe('<svg class="iconify">home</svg>')
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
	beforeEach(() => {
		iconCache.clear()
	})

	it('returns cached SVG for known icon', () => {
		iconCache.set('mdi:home', '<svg class="iconify">home</svg>')
		expect(iconifyResolver('mdi:home')).toBe('<svg class="iconify">home</svg>')
	})

	it('returns null for uncached icon', () => {
		expect(iconifyResolver('mdi:home')).toBeNull()
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

describe('wikiCommonsResolver', () => {
	beforeEach(() => {
		iconCache.clear()
	})

	it('returns cached data URI when cache is primed', () => {
		iconCache.set(
			'wiki:f/f1/PwC_2025_Logo.svg',
			'<img src="data:image/svg+xml;base64,abc" alt="" class="icon wiki-icon" style="display: inline-block;">',
		)
		const html = wikiCommonsResolver('wiki:f/f1/PwC_2025_Logo.svg')
		expect(html).toContain('data:image/svg+xml;base64,')
	})

	it('falls back to external URL when not cached', () => {
		const html = wikiCommonsResolver('wiki:f/f1/PwC_2025_Logo.svg')
		expect(html).toBe(
			'<img src="https://upload.wikimedia.org/wikipedia/commons/f/f1/PwC_2025_Logo.svg" alt="" class="icon wiki-icon" style="display: inline-block;">',
		)
	})

	it('resolves wikimedia-commons: prefix (alias)', () => {
		const html = wikiCommonsResolver('wikimedia-commons:f/f1/PwC_2025_Logo.svg')
		expect(html).toBe(
			'<img src="https://upload.wikimedia.org/wikipedia/commons/f/f1/PwC_2025_Logo.svg" alt="" class="icon wiki-icon" style="display: inline-block;">',
		)
	})

	it('trims whitespace around name', () => {
		const html = wikiCommonsResolver('  wiki:a/ab/Test.png  ')
		expect(html).toContain(
			'https://upload.wikimedia.org/wikipedia/commons/a/ab/Test.png',
		)
	})

	it('returns null for non-wiki: prefix', () => {
		expect(wikiCommonsResolver('mdi:home')).toBeNull()
		expect(wikiCommonsResolver('react')).toBeNull()
		expect(wikiCommonsResolver('wikimedia:foo')).toBeNull()
	})

	it('returns null for empty path after wiki:', () => {
		expect(wikiCommonsResolver('wiki:')).toBeNull()
		expect(wikiCommonsResolver('wikimedia-commons:')).toBeNull()
	})

	it('escapes HTML in path for fallback URL', () => {
		const html = wikiCommonsResolver('wiki:a/b/<script>.svg')
		expect(html).toContain('&lt;script&gt;')
		expect(html).not.toContain('<script>')
	})
})

describe('ghResolver', () => {
	beforeEach(() => {
		iconCache.clear()
	})

	it('returns cached data URI when cache is primed', () => {
		iconCache.set(
			'gh:facebook',
			'<img src="data:image/png;base64,abc" alt="" class="icon gh-icon" style="display: inline-block;">',
		)
		const html = githubResolver('gh:facebook')
		expect(html).toContain('data:image/png;base64,')
	})

	it('falls back to external URL when not cached', () => {
		const html = githubResolver('gh:facebook')
		expect(html).toBe(
			'<img src="https://github.com/facebook.png" alt="" class="icon gh-icon" style="display: inline-block;">',
		)
	})

	it('resolves github: prefix (alias)', () => {
		const html = githubResolver('github:facebook')
		expect(html).toBe(
			'<img src="https://github.com/facebook.png" alt="" class="icon gh-icon" style="display: inline-block;">',
		)
	})

	it('resolves gh:owner/repo to owner avatar (not raw file)', () => {
		const html = githubResolver('gh:facebook/react')
		expect(html).toBe(
			'<img src="https://github.com/facebook.png" alt="" class="icon gh-icon" style="display: inline-block;">',
		)
	})

	it('resolves gh:owner/repo/branch/path to raw file', () => {
		const html = githubResolver('gh:facebook/react/main/logo.svg')
		expect(html).toBe(
			'<img src="https://raw.githubusercontent.com/facebook/react/main/logo.svg" alt="" class="icon gh-icon" style="display: inline-block;">',
		)
	})

	it('handles deep paths in raw file mode', () => {
		const html = githubResolver('gh:owner/repo/main/assets/icons/logo.png')
		expect(html).toContain(
			'https://raw.githubusercontent.com/owner/repo/main/assets/icons/logo.png',
		)
	})

	it('trims whitespace around name', () => {
		const html = githubResolver('  gh:facebook  ')
		expect(html).toContain('https://github.com/facebook.png')
	})

	it('returns null for non-gh: prefix', () => {
		expect(githubResolver('mdi:home')).toBeNull()
		expect(githubResolver('react')).toBeNull()
	})

	it('returns null for empty path after gh:', () => {
		expect(githubResolver('gh:')).toBeNull()
		expect(githubResolver('github:')).toBeNull()
	})

	it('escapes HTML in path for fallback URL', () => {
		const html = githubResolver('gh:<script>')
		expect(html).toContain('&lt;script&gt;')
		expect(html).not.toContain('<script>')
	})
})
