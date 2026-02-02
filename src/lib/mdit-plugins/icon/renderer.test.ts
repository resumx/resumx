import { describe, it, expect } from 'vitest'
import {
	iconifyResolver,
	createCustomResolver,
	resumxIconResolver,
	wikiCommonsResolver,
	githubResolver,
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
			'<span class="iconify" data-icon="mdi:home" style="display: inline-block;"></span>',
		)
		expect(render('react')).toBe(
			'<span class="iconify" data-icon="react" style="display: inline-block;"></span>',
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
			'<span class="iconify" data-icon="mdi:home" style="display: inline-block;"></span>',
		)
	})

	it('escapes HTML in icon name', () => {
		expect(iconifyResolver('mdi:foo<script>')).toBe(
			'<span class="iconify" data-icon="mdi:foo&lt;script&gt;" style="display: inline-block;"></span>',
		)
	})

	it('escapes " in icon name', () => {
		expect(iconifyResolver('mdi:foo" onclick="alert(1)')).toBe(
			'<span class="iconify" data-icon="mdi:foo&quot; onclick=&quot;alert(1)" style="display: inline-block;"></span>',
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
		expect(html).toContain('class="iconify"')
	})

	it('uses override for aws (amazonwebservices)', () => {
		const html = resumxIconResolver('aws')
		expect(html).toContain('devicon:amazonwebservices')
	})

	it('uses override for nodejs (logos set)', () => {
		const html = resumxIconResolver('nodejs')
		expect(html).toContain('logos:nodejs-icon')
	})

	it.each([
		{ name: 'netflix', expected: 'logos:netflix-icon' },
		{ name: 'firefox', expected: 'logos:firefox' },
		{ name: 'browserstack', expected: 'logos:browserstack' },
	] as const)(
		'resolves logos name $name to HTML with logos prefix',
		({ name, expected }) => {
			const html = resumxIconResolver(name)
			if (html === null) {
				throw new Error(`Expected ${name} to resolve`)
			}
			expect(html).toContain(expected)
		},
	)

	it('returns null for unknown name', () => {
		expect(resumxIconResolver('unknown-icon-name')).toBeNull()
	})
})

describe('wikiCommonsResolver', () => {
	it('resolves wiki: prefix to Wikimedia Commons img tag', () => {
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

	it('escapes HTML in path', () => {
		const html = wikiCommonsResolver('wiki:a/b/<script>.svg')
		expect(html).toContain('&lt;script&gt;')
		expect(html).not.toContain('<script>')
	})
})

describe('ghResolver', () => {
	it('resolves gh:owner to GitHub avatar', () => {
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

	it('escapes HTML in path', () => {
		const html = githubResolver('gh:<script>')
		expect(html).toContain('&lt;script&gt;')
		expect(html).not.toContain('<script>')
	})
})
