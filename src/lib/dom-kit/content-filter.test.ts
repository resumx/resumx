import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import {
	filterBySelector,
	extractBySelector,
	resolveValues,
} from './content-filter.js'

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

/** Extract lang values from an element */
const langExtractor = (el: Element) => {
	const v = el.getAttribute('lang')
	return v ? [v] : []
}

/** Extract role names from an element's class attribute */
const ROLE_CLASS_RE = /@([^\s"']+)/g
const roleExtractor = (el: Element) => {
	const cls = el.getAttribute('class') ?? ''
	ROLE_CLASS_RE.lastIndex = 0
	const roles: string[] = []
	let m
	while ((m = ROLE_CLASS_RE.exec(cls))) roles.push(m[1]!)
	return roles
}

// =============================================================================
// filterBySelector
// =============================================================================

describe('filterBySelector', () => {
	describe('lang filtering ([lang]:not(...))', () => {
		it('keeps elements matching the active language', () => {
			const html = '<span lang="en">Hello</span>'
			const result = filterBySelector(html, '[lang]:not([lang="en"])')
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="en"]')).toBeTruthy()
			expect(doc.querySelector('[lang="en"]')?.textContent).toBe('Hello')
		})

		it('removes elements not matching the active language', () => {
			const html = '<span lang="en">Hello</span><span lang="fr">Bonjour</span>'
			const result = filterBySelector(html, '[lang]:not([lang="en"])')
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
			const result = filterBySelector(html, '[lang]:not([lang="en"])')
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="en"]')).toBeTruthy()
			expect(doc.querySelector('p')?.textContent).toBe('Common content')
			expect(doc.querySelector('[lang="fr"]')).toBeNull()
		})

		it('handles list items with mixed language content', () => {
			const html = `
				<ul>
					<li lang="en">Reduced latency by 60%</li>
					<li lang="fr">Reduction de la latence de 60%</li>
					<li>React, Node.js, PostgreSQL</li>
				</ul>
			`
			const result = filterBySelector(html, '[lang]:not([lang="en"])')
			const doc = parseHtml(result)

			const items = doc.querySelectorAll('li')
			expect(items.length).toBe(2)
			expect(items[0]?.textContent).toBe('Reduced latency by 60%')
			expect(items[1]?.textContent).toBe('React, Node.js, PostgreSQL')
		})

		it('handles heading spans for bilingual headings', () => {
			const html =
				'<h2><span lang="en">Experience</span> <span lang="fr">Experience</span></h2>'
			const result = filterBySelector(html, '[lang]:not([lang="en"])')
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
					<p>Contenu en francais</p>
					<ul><li>Point 1</li></ul>
				</div>
			`
			const result = filterBySelector(html, '[lang]:not([lang="en"])')
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="fr"]')).toBeNull()
			expect(result).not.toContain('Contenu en francais')
		})

		it('keeps fenced divs with matching lang', () => {
			const html = `
				<div lang="en">
					<p>English content</p>
				</div>
			`
			const result = filterBySelector(html, '[lang]:not([lang="en"])')
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="en"]')).toBeTruthy()
			expect(doc.querySelector('[lang="en"] p')?.textContent).toBe(
				'English content',
			)
		})

		it('returns empty string for empty input', () => {
			expect(filterBySelector('', '[lang]:not([lang="en"])')).toBe('')
		})

		it('handles BCP 47 subtags correctly', () => {
			const html =
				'<span lang="zh-CN">Simplified</span><span lang="zh-TW">Traditional</span>'
			const result = filterBySelector(html, '[lang]:not([lang="zh-CN"])')
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="zh-CN"]')).toBeTruthy()
			expect(doc.querySelector('[lang="zh-TW"]')).toBeNull()
		})

		it('preserves elements with lang + role attributes when filtering by lang', () => {
			const html = `
				<li lang="en" class="@backend">Built REST APIs</li>
				<li lang="fr" class="@backend">Developpe des APIs REST</li>
			`
			const result = filterBySelector(html, '[lang]:not([lang="en"])')
			const doc = parseHtml(result)

			const items = doc.querySelectorAll('li')
			expect(items.length).toBe(1)
			expect(items[0]?.textContent).toBe('Built REST APIs')
			expect(items[0]?.getAttribute('class')).toContain('@backend')
		})
	})

	describe('role filtering ([class*="@"]:not(...))', () => {
		it('keeps elements matching the active role', () => {
			const html = '<div class="@frontend">Frontend content</div>'
			const result = filterBySelector(
				html,
				'[class*="@"]:not([class*="@frontend"])',
			)
			expect(result).toContain('Frontend content')
			expect(result).toContain('@frontend')
		})

		it('removes elements not matching the active role', () => {
			const html = '<div class="@backend">Backend content</div>'
			const result = filterBySelector(
				html,
				'[class*="@"]:not([class*="@frontend"])',
			)
			expect(result).not.toContain('Backend content')
			expect(result).not.toContain('@backend')
		})

		it('keeps elements without any role class (common content)', () => {
			const html = `
				<div class="@frontend">Frontend</div>
				<div class="common">Common content</div>
				<div class="@backend">Backend</div>
			`
			const result = filterBySelector(
				html,
				'[class*="@"]:not([class*="@frontend"])',
			)
			expect(result).toContain('Frontend')
			expect(result).toContain('Common content')
			expect(result).not.toContain('Backend')
		})

		it('keeps elements with multiple roles if one matches', () => {
			const html = '<div class="@frontend @fullstack">Shared</div>'
			const result = filterBySelector(
				html,
				'[class*="@"]:not([class*="@frontend"])',
			)
			expect(result).toContain('Shared')
		})

		it('handles list items correctly', () => {
			const html = `
				<ul>
					<li class="@frontend">React</li>
					<li class="@backend">Node.js</li>
					<li>Common skill</li>
				</ul>
			`
			const result = filterBySelector(
				html,
				'[class*="@"]:not([class*="@frontend"])',
			)
			expect(result).toContain('React')
			expect(result).not.toContain('Node.js')
			expect(result).toContain('Common skill')
		})

		it('handles nested elements - removes parent removes children', () => {
			const html = `
				<div class="@backend">
					<p>Backend paragraph</p>
					<span>Backend span</span>
				</div>
			`
			const result = filterBySelector(
				html,
				'[class*="@"]:not([class*="@frontend"])',
			)
			expect(result).not.toContain('Backend paragraph')
			expect(result).not.toContain('Backend span')
		})

		it('handles fenced divs with role class', () => {
			const html = `
				<div class="@frontend">
					<p>Frontend skills</p>
					<ul>
						<li>React</li>
						<li>TypeScript</li>
					</ul>
				</div>
			`
			const result = filterBySelector(
				html,
				'[class*="@"]:not([class*="@frontend"])',
			)
			expect(result).toContain('Frontend skills')
			expect(result).toContain('React')
		})

		it('returns empty string when all content is filtered out', () => {
			const html = '<div class="@backend">Backend only</div>'
			const result = filterBySelector(
				html,
				'[class*="@"]:not([class*="@frontend"])',
			)
			expect(result.trim()).toBe('')
		})

		it('preserves HTML structure of remaining elements', () => {
			const html = `
				<article>
					<h2>Skills</h2>
					<div class="@frontend">
						<h3>Frontend</h3>
					</div>
					<div class="@backend">
						<h3>Backend</h3>
					</div>
				</article>
			`
			const result = filterBySelector(
				html,
				'[class*="@"]:not([class*="@frontend"])',
			)
			expect(result).toContain('<article>')
			expect(result).toContain('<h2>Skills</h2>')
			expect(result).toContain('<h3>Frontend</h3>')
			expect(result).not.toContain('<h3>Backend</h3>')
		})

		it('handles span elements with role class', () => {
			const html =
				'<p>Experience: <span class="@frontend">5 years React</span></p>'
			const result = filterBySelector(
				html,
				'[class*="@"]:not([class*="@frontend"])',
			)
			expect(result).toContain('5 years React')
		})

		it('removes span elements not matching role', () => {
			const html =
				'<p>Experience: <span class="@backend">3 years Node</span></p>'
			const result = filterBySelector(
				html,
				'[class*="@"]:not([class*="@frontend"])',
			)
			expect(result).not.toContain('3 years Node')
			expect(result).toContain('Experience:')
		})
	})
})

// =============================================================================
// extractBySelector
// =============================================================================

describe('extractBySelector', () => {
	describe('lang extraction ([lang])', () => {
		it('extracts single language from lang attribute', () => {
			const html = '<span lang="en">Hello</span>'
			expect(extractBySelector(html, '[lang]', langExtractor)).toEqual(['en'])
		})

		it('extracts multiple languages from different elements', () => {
			const html = '<span lang="en">Hello</span><span lang="fr">Bonjour</span>'
			const langs = extractBySelector(html, '[lang]', langExtractor)
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
			expect(extractBySelector(html, '[lang]', langExtractor)).toEqual(['en'])
		})

		it('returns empty array for HTML without lang attributes', () => {
			const html = '<div class="highlight">No langs here</div>'
			expect(extractBySelector(html, '[lang]', langExtractor)).toEqual([])
		})

		it('returns empty array for empty HTML', () => {
			expect(extractBySelector('', '[lang]', langExtractor)).toEqual([])
		})

		it('handles BCP 47 language tags with subtags', () => {
			const html = `
				<span lang="zh-CN">Simplified Chinese</span>
				<span lang="zh-TW">Traditional Chinese</span>
				<span lang="pt-BR">Portuguese</span>
			`
			const langs = extractBySelector(html, '[lang]', langExtractor)
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
			const langs = extractBySelector(html, '[lang]', langExtractor)
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
			const langs = extractBySelector(html, '[lang]', langExtractor)
			expect(langs).toContain('en')
			expect(langs).toContain('fr')
		})

		it('extracts lang from elements that also have class and role', () => {
			const html = '<li lang="en" class="@frontend highlight">React</li>'
			expect(extractBySelector(html, '[lang]', langExtractor)).toEqual(['en'])
		})

		it('ignores empty lang attributes', () => {
			const html = '<span lang="">Empty</span><span lang="en">English</span>'
			expect(extractBySelector(html, '[lang]', langExtractor)).toEqual(['en'])
		})
	})

	describe('role extraction ([class*="@"])', () => {
		it('extracts single role from class attribute', () => {
			const html = '<div class="@frontend">Content</div>'
			expect(extractBySelector(html, '[class*="@"]', roleExtractor)).toEqual([
				'frontend',
			])
		})

		it('extracts multiple roles from same element', () => {
			const html = '<div class="@frontend @fullstack">Content</div>'
			const roles = extractBySelector(html, '[class*="@"]', roleExtractor)
			expect(roles).toContain('frontend')
			expect(roles).toContain('fullstack')
		})

		it('extracts roles from multiple elements', () => {
			const html = `
				<div class="@frontend">Frontend</div>
				<div class="@backend">Backend</div>
				<div class="@fullstack">Fullstack</div>
			`
			const roles = extractBySelector(html, '[class*="@"]', roleExtractor)
			expect(roles).toContain('frontend')
			expect(roles).toContain('backend')
			expect(roles).toContain('fullstack')
		})

		it('returns unique roles (no duplicates)', () => {
			const html = `
				<div class="@frontend">One</div>
				<div class="@frontend">Two</div>
				<li class="@frontend">Three</li>
			`
			const roles = extractBySelector(html, '[class*="@"]', roleExtractor)
			expect(roles).toEqual(['frontend'])
		})

		it('returns empty array for HTML without roles', () => {
			const html = '<div class="highlight">No roles here</div>'
			expect(extractBySelector(html, '[class*="@"]', roleExtractor)).toEqual([])
		})

		it('returns empty array for empty HTML', () => {
			expect(extractBySelector('', '[class*="@"]', roleExtractor)).toEqual([])
		})

		it('ignores @ in text content (only extracts from class attribute)', () => {
			const html = '<p>This mentions @frontend but is not a class</p>'
			expect(extractBySelector(html, '[class*="@"]', roleExtractor)).toEqual([])
		})

		it('handles role classes with other classes', () => {
			const html = '<div class="highlight @frontend text-bold">Content</div>'
			expect(extractBySelector(html, '[class*="@"]', roleExtractor)).toEqual([
				'frontend',
			])
		})

		it('handles nested elements with roles', () => {
			const html = `
				<div class="@frontend">
					<span class="@fullstack">Nested</span>
				</div>
			`
			const roles = extractBySelector(html, '[class*="@"]', roleExtractor)
			expect(roles).toContain('frontend')
			expect(roles).toContain('fullstack')
		})

		it('extracts roles from list items', () => {
			const html = `
				<ul>
					<li class="@frontend">React</li>
					<li class="@backend">Node.js</li>
					<li>Common skill</li>
				</ul>
			`
			const roles = extractBySelector(html, '[class*="@"]', roleExtractor)
			expect(roles).toContain('frontend')
			expect(roles).toContain('backend')
			expect(roles).toHaveLength(2)
		})
	})
})

// =============================================================================
// resolveValues
// =============================================================================

describe('resolveValues', () => {
	describe('with language dimension', () => {
		it('returns explicit lang as highest priority', () => {
			expect(resolveValues(['en'], ['en', 'fr'], 'language')).toEqual(['en'])
		})

		it('returns multiple explicit langs', () => {
			expect(
				resolveValues(['en', 'fr'], ['en', 'fr', 'de'], 'language'),
			).toEqual(['en', 'fr'])
		})

		it('returns discovered langs if no explicit', () => {
			expect(resolveValues([], ['en', 'fr', 'de'], 'language')).toEqual([
				'en',
				'fr',
				'de',
			])
		})

		it('returns empty array if no langs at any level', () => {
			expect(resolveValues([], [], 'language')).toEqual([])
		})

		it('throws error when explicit lang does not exist in discovered', () => {
			expect(() => resolveValues(['de'], ['en', 'fr'], 'language')).toThrow(
				"language 'de' does not exist",
			)
		})

		it('throws error when multiple explicit langs do not exist', () => {
			expect(() =>
				resolveValues(['de', 'ja'], ['en', 'fr'], 'language'),
			).toThrow("languages 'de', 'ja' does not exist")
		})

		it('includes available languages in error message', () => {
			expect(() =>
				resolveValues(['de'], ['en', 'fr', 'zh-CN'], 'language'),
			).toThrow('Available languages: en, fr, zh-CN')
		})

		it('shows helpful message when no languages found', () => {
			expect(() => resolveValues(['en'], [], 'language')).toThrow(
				'No languages found in content',
			)
		})

		it('allows explicit lang that exists in discovered', () => {
			expect(resolveValues(['fr'], ['en', 'fr'], 'language')).toEqual(['fr'])
		})
	})

	describe('with role dimension', () => {
		it('returns explicit role as highest priority', () => {
			expect(
				resolveValues(
					['frontend'],
					['frontend', 'backend', 'fullstack'],
					'role',
				),
			).toEqual(['frontend'])
		})

		it('returns multiple explicit roles', () => {
			expect(
				resolveValues(
					['frontend', 'backend'],
					['frontend', 'backend', 'fullstack'],
					'role',
				),
			).toEqual(['frontend', 'backend'])
		})

		it('returns discovered roles if no explicit', () => {
			expect(
				resolveValues([], ['frontend', 'backend', 'fullstack'], 'role'),
			).toEqual(['frontend', 'backend', 'fullstack'])
		})

		it('returns empty array if no roles at any level', () => {
			expect(resolveValues([], [], 'role')).toEqual([])
		})

		it('handles empty explicit array (falls through to discovered)', () => {
			expect(resolveValues([], ['frontend', 'backend'], 'role')).toEqual([
				'frontend',
				'backend',
			])
		})

		it('throws error when explicit role does not exist in discovered roles', () => {
			expect(() =>
				resolveValues(['nonexistent'], ['frontend', 'backend'], 'role'),
			).toThrow("role 'nonexistent' does not exist")
		})

		it('throws error when multiple explicit roles do not exist', () => {
			expect(() =>
				resolveValues(
					['frontend', 'typo1', 'typo2'],
					['frontend', 'backend'],
					'role',
				),
			).toThrow("roles 'typo1', 'typo2' does not exist")
		})

		it('throws error when explicit role is typo of existing role', () => {
			expect(() =>
				resolveValues(
					['fronted'], // typo
					['frontend', 'backend'],
					'role',
				),
			).toThrow("role 'fronted' does not exist")
		})

		it('includes available roles in error message', () => {
			expect(() =>
				resolveValues(['devops'], ['frontend', 'backend', 'fullstack'], 'role'),
			).toThrow('Available roles: frontend, backend, fullstack')
		})

		it('allows explicit role that exists in discovered', () => {
			expect(
				resolveValues(['frontend'], ['frontend', 'backend'], 'role'),
			).toEqual(['frontend'])
		})
	})
})
