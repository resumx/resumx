import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { extractLangs, filterByLang, resolveLangs } from './langs.js'

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Parse HTML string into a DOM for structural assertions
 */
function parseHtml(html: string) {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!
	return {
		body: root,
		querySelector: (selector: string) => root.querySelector(selector),
		querySelectorAll: (selector: string) => root.querySelectorAll(selector),
	}
}

// =============================================================================
// Tests
// =============================================================================

describe('langs SDK', () => {
	describe('extractLangs', () => {
		it('extracts single language from lang attribute', () => {
			const html = '<span lang="en">Hello</span>'
			expect(extractLangs(html)).toEqual(['en'])
		})

		it('extracts multiple languages from different elements', () => {
			const html = '<span lang="en">Hello</span><span lang="fr">Bonjour</span>'
			const langs = extractLangs(html)
			expect(langs).toContain('en')
			expect(langs).toContain('fr')
			expect(langs).toHaveLength(2)
		})

		it('returns unique languages (no duplicates)', () => {
			const html = `
				<span lang="en">Hello</span>
				<span lang="en">World</span>
				<p lang="en">Another</p>
			`
			expect(extractLangs(html)).toEqual(['en'])
		})

		it('returns empty array for HTML without lang attributes', () => {
			const html = '<div class="highlight">No langs here</div>'
			expect(extractLangs(html)).toEqual([])
		})

		it('returns empty array for empty HTML', () => {
			expect(extractLangs('')).toEqual([])
		})

		it('handles BCP 47 language tags with subtags', () => {
			const html = `
				<span lang="zh-CN">简体中文</span>
				<span lang="zh-TW">繁體中文</span>
				<span lang="pt-BR">Português</span>
			`
			const langs = extractLangs(html)
			expect(langs).toContain('zh-CN')
			expect(langs).toContain('zh-TW')
			expect(langs).toContain('pt-BR')
			expect(langs).toHaveLength(3)
		})

		it('extracts lang from various element types', () => {
			const html = `
				<span lang="en">span</span>
				<p lang="fr">paragraph</p>
				<li lang="de">list item</li>
				<div lang="es">div</div>
			`
			const langs = extractLangs(html)
			expect(langs).toContain('en')
			expect(langs).toContain('fr')
			expect(langs).toContain('de')
			expect(langs).toContain('es')
		})

		it('extracts lang from nested elements', () => {
			const html = `
				<div lang="en">
					<span lang="fr">Nested</span>
				</div>
			`
			const langs = extractLangs(html)
			expect(langs).toContain('en')
			expect(langs).toContain('fr')
		})

		it('extracts lang from elements that also have class and role', () => {
			const html = '<li lang="en" class="role:frontend highlight">React</li>'
			expect(extractLangs(html)).toEqual(['en'])
		})

		it('ignores empty lang attributes', () => {
			const html = '<span lang="">Empty</span><span lang="en">English</span>'
			expect(extractLangs(html)).toEqual(['en'])
		})
	})

	describe('filterByLang', () => {
		it('keeps elements matching the active language', () => {
			const html = '<span lang="en">Hello</span>'
			const result = filterByLang(html, 'en')
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="en"]')).toBeTruthy()
			expect(doc.querySelector('[lang="en"]')?.textContent).toBe('Hello')
		})

		it('removes elements not matching the active language', () => {
			const html = '<span lang="en">Hello</span><span lang="fr">Bonjour</span>'
			const result = filterByLang(html, 'en')
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="en"]')).toBeTruthy()
			expect(doc.querySelector('[lang="fr"]')).toBeNull()
		})

		it('keeps elements without any lang attribute (common content)', () => {
			const html = `
				<span lang="en">Hello</span>
				<p>Common content</p>
				<span lang="fr">Bonjour</span>
			`
			const result = filterByLang(html, 'en')
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="en"]')).toBeTruthy()
			expect(doc.querySelector('p')?.textContent).toBe('Common content')
			expect(doc.querySelector('[lang="fr"]')).toBeNull()
		})

		it('handles list items with mixed language content', () => {
			const html = `
				<ul>
					<li lang="en">Reduced latency by 60%</li>
					<li lang="fr">Réduction de la latence de 60%</li>
					<li>React, Node.js, PostgreSQL</li>
				</ul>
			`
			const result = filterByLang(html, 'en')
			const doc = parseHtml(result)

			const items = doc.querySelectorAll('li')
			expect(items.length).toBe(2)
			expect(items[0]?.textContent).toBe('Reduced latency by 60%')
			expect(items[1]?.textContent).toBe('React, Node.js, PostgreSQL')
		})

		it('handles heading spans for bilingual headings', () => {
			const html =
				'<h2><span lang="en">Experience</span> <span lang="fr">Expérience</span></h2>'
			const result = filterByLang(html, 'en')
			const doc = parseHtml(result)

			expect(doc.querySelector('h2 [lang="en"]')).toBeTruthy()
			expect(doc.querySelector('h2 [lang="fr"]')).toBeNull()
			expect(doc.querySelector('h2')?.textContent?.trim()).toContain(
				'Experience',
			)
		})

		it('removes fenced divs with non-matching lang', () => {
			const html = `
				<div lang="fr">
					<p>Contenu en français</p>
					<ul><li>Point 1</li></ul>
				</div>
			`
			const result = filterByLang(html, 'en')
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="fr"]')).toBeNull()
			expect(result).not.toContain('Contenu en français')
		})

		it('keeps fenced divs with matching lang', () => {
			const html = `
				<div lang="en">
					<p>English content</p>
				</div>
			`
			const result = filterByLang(html, 'en')
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="en"]')).toBeTruthy()
			expect(doc.querySelector('[lang="en"] p')?.textContent).toBe(
				'English content',
			)
		})

		it('returns empty string for empty input', () => {
			expect(filterByLang('', 'en')).toBe('')
		})

		it('handles BCP 47 subtags correctly', () => {
			const html =
				'<span lang="zh-CN">简体</span><span lang="zh-TW">繁體</span>'
			const result = filterByLang(html, 'zh-CN')
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="zh-CN"]')).toBeTruthy()
			expect(doc.querySelector('[lang="zh-TW"]')).toBeNull()
		})

		it('preserves elements with lang + role attributes when filtering by lang', () => {
			const html = `
				<li lang="en" class="role:backend">Built REST APIs</li>
				<li lang="fr" class="role:backend">Développé des APIs REST</li>
			`
			const result = filterByLang(html, 'en')
			const doc = parseHtml(result)

			const items = doc.querySelectorAll('li')
			expect(items.length).toBe(1)
			expect(items[0]?.textContent).toBe('Built REST APIs')
			expect(items[0]?.getAttribute('class')).toContain('role:backend')
		})
	})

	describe('resolveLangs', () => {
		it('returns explicit lang as highest priority', () => {
			expect(resolveLangs(['en'], ['en', 'fr'])).toEqual(['en'])
		})

		it('returns multiple explicit langs', () => {
			expect(resolveLangs(['en', 'fr'], ['en', 'fr', 'de'])).toEqual([
				'en',
				'fr',
			])
		})

		it('returns discovered langs if no explicit', () => {
			expect(resolveLangs([], ['en', 'fr', 'de'])).toEqual(['en', 'fr', 'de'])
		})

		it('returns empty array if no langs at any level', () => {
			expect(resolveLangs([], [])).toEqual([])
		})

		it('throws error when explicit lang does not exist in discovered', () => {
			expect(() => resolveLangs(['de'], ['en', 'fr'])).toThrow(
				"language 'de' does not exist",
			)
		})

		it('throws error when multiple explicit langs do not exist', () => {
			expect(() => resolveLangs(['de', 'ja'], ['en', 'fr'])).toThrow(
				"languages 'de', 'ja' does not exist",
			)
		})

		it('includes available languages in error message', () => {
			expect(() => resolveLangs(['de'], ['en', 'fr', 'zh-CN'])).toThrow(
				'Available languages: en, fr, zh-CN',
			)
		})

		it('shows helpful message when no languages found', () => {
			expect(() => resolveLangs(['en'], [])).toThrow(
				'No languages found in content',
			)
		})

		it('allows explicit lang that exists in discovered', () => {
			expect(resolveLangs(['fr'], ['en', 'fr'])).toEqual(['fr'])
		})
	})
})
