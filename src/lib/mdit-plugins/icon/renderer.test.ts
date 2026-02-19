import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { iconifyResolver, createCustomResolver } from './index.js'
import { iconCache } from './utils.js'
import {
	buildRender,
	createIconRenderRule,
	createAssetsResolver,
	emojiResolver,
	processFrontmatterIcons,
	wrapIconSvg,
} from './renderer.js'

describe('buildRender', () => {
	it('tries resolvers in order; first non-null wins', () => {
		const render = buildRender({
			resolvers: [
				createCustomResolver({ star: '<span class="star">★</span>' }),
			],
		})
		expect(render('star')).toBe('<span class="star">★</span>')
	})

	it('falls back to :name: when no resolver matches', () => {
		const render = buildRender({
			resolvers: [name => (name === 'known' ? '<b>known</b>' : null)],
		})
		expect(render('unknown')).toBe(':unknown:')
	})

	it('falls back to :name: when no options provided', () => {
		const render = buildRender({})
		expect(render('any')).toBe(':any:')
	})

	it('escapes dangerous names in fallback', () => {
		const render = buildRender({})
		expect(render('foo<script>alert(1)</script>')).toBe(
			':foo&lt;script&gt;alert(1)&lt;/script&gt;:',
		)
		expect(render('a&quot;b&c')).toBe(':a&amp;quot;b&amp;c:')
	})

	it('iconifyResolver returns cached SVG when cache is primed', () => {
		iconCache.set('mdi/home', '<svg class="iconify">home</svg>')
		const render = buildRender({
			resolvers: [iconifyResolver],
		})
		expect(render('mdi/home')).toBe('<svg class="iconify">home</svg>')
	})
})

describe('emojiResolver', () => {
	it('returns the emoji unicode character for a known shortcode', () => {
		expect(emojiResolver('rocket')).toBe('🚀')
	})

	it('returns null for an unknown name', () => {
		expect(emojiResolver('not-an-emoji-xyz')).toBeNull()
	})

	it('trims whitespace', () => {
		expect(emojiResolver('  rocket  ')).toBe('🚀')
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
		iconCache.set('mdi/home', '<svg class="iconify">home</svg>')
		expect(iconifyResolver('mdi/home')).toBe('<svg class="iconify">home</svg>')
	})

	it('returns null for uncached icon', () => {
		expect(iconifyResolver('mdi/home')).toBeNull()
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

describe('wrapIconSvg', () => {
	it('wraps svg in span.icon', () => {
		const svg =
			'<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle/></svg>'
		const result = wrapIconSvg(svg)
		expect(result).toBe(`<span class="icon">${svg}</span>`)
	})

	it('does not modify the inner SVG', () => {
		const svg =
			'<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path class="st0" d="M0 0"/></svg>'
		const result = wrapIconSvg(svg)
		expect(result).toContain(svg)
		expect(result).toMatch(/^<span class="icon">/)
		expect(result).toMatch(/<\/span>$/)
	})
})

describe('createAssetsResolver', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), 'assets-resolver-test-'))
	})

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true })
	})

	it('resolves SVG file by slug name', () => {
		writeFileSync(
			join(tempDir, 'react.svg'),
			'<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>',
		)
		const resolve = createAssetsResolver(tempDir)
		const html = resolve('react')
		expect(html).toMatch(/^<span class="icon">/)
		expect(html).toContain('<svg')
		expect(html).toContain('<circle/>')
	})

	it('returns null for missing SVG file', () => {
		const resolve = createAssetsResolver(tempDir)
		expect(resolve('nonexistent')).toBeNull()
	})

	it('skips names with slash (Iconify format)', () => {
		writeFileSync(join(tempDir, 'mdi_home.svg'), '<svg/>')
		const resolve = createAssetsResolver(tempDir)
		expect(resolve('mdi/home')).toBeNull()
	})

	it('trims whitespace around name', () => {
		writeFileSync(
			join(tempDir, 'docker.svg'),
			'<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
		)
		const resolve = createAssetsResolver(tempDir)
		expect(resolve('  docker  ')).toMatch(/^<span class="icon">/)
	})

	it('handles nested icon directory', () => {
		const subDir = join(tempDir, 'icons')
		mkdirSync(subDir)
		writeFileSync(join(subDir, 'test.svg'), '<svg><path d="test"/></svg>')
		const resolve = createAssetsResolver(subDir)
		expect(resolve('test')).toMatch(/^<span class="icon">/)
	})
})

describe('processFrontmatterIcons', () => {
	it('processes SVG values into span.icon wrapped HTML', async () => {
		const map = await processFrontmatterIcons({
			myicon: '<svg><circle/></svg>',
		})
		const html = map.get('myicon')!
		expect(html).toMatch(/^<span class="icon">/)
		expect(html).toContain('<svg')
	})

	it('wraps SVG values in span.icon', async () => {
		const map = await processFrontmatterIcons({
			logo: '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
		})
		const html = map.get('logo')!
		expect(html).toMatch(/^<span class="icon">/)
		expect(html).toContain('<rect/>')
	})

	it('processes data URI values (wraps in img tag)', async () => {
		const map = await processFrontmatterIcons({
			logo: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
		})
		const html = map.get('logo')!
		expect(html).toContain('<img')
		expect(html).toContain('data:image/svg+xml;base64,')
		expect(html).toContain('class="icon"')
	})

	it('fetches URL values and inlines as data URI', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				headers: { get: () => 'image/svg+xml' },
				arrayBuffer: () =>
					Promise.resolve(
						new TextEncoder().encode('<svg><circle/></svg>').buffer,
					),
			}),
		)
		const map = await processFrontmatterIcons({
			logo: 'https://example.com/logo.svg',
		})
		const html = map.get('logo')!
		expect(html).toContain('<img')
		expect(html).toContain('data:image/svg+xml;base64,')
		expect(html).toContain('class="icon"')
	})

	it('falls back to external URL when fetch fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, status: 404 }),
		)
		const map = await processFrontmatterIcons({
			logo: 'https://example.com/missing.svg',
		})
		const html = map.get('logo')!
		expect(html).toContain('<img')
		expect(html).toContain('src="https://example.com/missing.svg"')
		expect(html).toContain('class="icon"')
	})

	it('trims whitespace around keys', async () => {
		const map = await processFrontmatterIcons({
			'  myicon  ': '<svg><circle/></svg>',
		})
		expect(map.get('myicon')).not.toBeUndefined()
	})

	it('returns empty map for empty input', async () => {
		const map = await processFrontmatterIcons({})
		expect(map.size).toBe(0)
	})

	it('strips XML declarations from SVG values', async () => {
		const map = await processFrontmatterIcons({
			icon: '<?xml version="1.0" encoding="utf-8"?><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
		})
		const html = map.get('icon')!
		expect(html).not.toContain('<?xml')
		expect(html).toContain('<svg')
		expect(html).toContain('viewBox')
	})

	it('converts <style> rules to inline attributes in SVG values', async () => {
		const map = await processFrontmatterIcons({
			icon: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><style>.a{fill:#ff0000}</style><path class="a" d="M0 0"/></svg>',
		})
		const html = map.get('icon')!
		expect(html).not.toContain('<style>')
		expect(html).toContain('fill="#ff0000"')
	})

	it('removes explicit width/height when viewBox exists in SVG values', async () => {
		const map = await processFrontmatterIcons({
			icon: '<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
		})
		const html = map.get('icon')!
		expect(html).not.toMatch(/width="800"/)
		expect(html).not.toMatch(/height="600"/)
		expect(html).toContain('viewBox')
	})

	it('prevents CSS collisions by inlining shared class names in SVG values', async () => {
		const map = await processFrontmatterIcons({
			icon1:
				'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><style>.a{fill:#0076ce}</style><path class="a" d="M1"/></svg>',
			icon2:
				'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><style>.a{fill:#eb1000}</style><path class="a" d="M2"/></svg>',
		})
		const html1 = map.get('icon1')!
		const html2 = map.get('icon2')!
		expect(html1).toContain('fill="#0076ce"')
		expect(html2).toContain('fill="#eb1000"')
		expect(html1).not.toContain('<style>')
		expect(html2).not.toContain('<style>')
	})
})

describe('buildRender with env.frontmatterIcons', () => {
	it('resolves from env.frontmatterIcons with highest priority', () => {
		const render = buildRender({
			resolvers: [() => '<span>fallback</span>'],
		})
		const env = {
			frontmatterIcons: new Map([['star', '<span>fm-star</span>']]),
		}
		expect(render('star', env)).toBe('<span>fm-star</span>')
	})

	it('falls through to resolvers when icon not in env', () => {
		const render = buildRender({
			resolvers: [
				createCustomResolver({ star: '<span class="star">★</span>' }),
			],
		})
		const env = {
			frontmatterIcons: new Map([['other', '<span>other</span>']]),
		}
		expect(render('star', env)).toBe('<span class="star">★</span>')
	})

	it('works without env (undefined)', () => {
		const render = buildRender({
			resolvers: [
				createCustomResolver({ star: '<span class="star">★</span>' }),
			],
		})
		expect(render('star')).toBe('<span class="star">★</span>')
	})
})
