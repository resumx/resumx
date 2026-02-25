import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { filterByRole } from './index.js'
import type { PipelineContext } from '../types.js'

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

/**
 * Create a pipeline context with optional activeRole
 */
function createContext(activeRole?: string): PipelineContext {
	return {
		config: { activeRole },
		env: { css: '' },
	}
}

// =============================================================================
// Tests: filterByRole
// =============================================================================

describe('filterByRole', () => {
	describe('when no activeRole is specified', () => {
		it('returns unchanged when activeRole is undefined', () => {
			const html = '<p class="@frontend">Frontend</p><p>Common</p>'
			const result = filterByRole(html, createContext())

			expect(result).toBe(html)
		})

		it('returns unchanged when activeRole is empty string', () => {
			const html = '<p class="@frontend">Frontend</p><p>Common</p>'
			const result = filterByRole(html, createContext(''))

			// Empty string is falsy, so it should return unchanged
			expect(result).toBe(html)
		})
	})

	describe('filtering behavior', () => {
		it('keeps elements matching active role', () => {
			const html =
				'<p class="@frontend">Frontend content</p><p class="@backend">Backend content</p>'
			const result = filterByRole(html, createContext('frontend'))
			const doc = parseHtml(result)

			// Verify exact DOM structure: only frontend element remains
			expect(doc.body.children.length).toBe(1)
			const p = doc.body.children[0] as Element
			expect(p.tagName).toBe('P')
			expect(p.getAttribute('class')).toBe('@frontend')
			expect(p.textContent).toBe('Frontend content')
		})

		it('keeps elements without role class (common content)', () => {
			const html = '<p class="@frontend">Frontend</p><p>Common content</p>'
			const result = filterByRole(html, createContext('frontend'))
			const doc = parseHtml(result)

			// Verify both elements remain in order
			expect(doc.body.children.length).toBe(2)
			const p1 = doc.body.children[0] as Element
			const p2 = doc.body.children[1] as Element
			expect(p1.getAttribute('class')).toBe('@frontend')
			expect(p1.textContent).toBe('Frontend')
			expect(p2.hasAttribute('class')).toBe(false)
			expect(p2.textContent).toBe('Common content')
		})

		it('removes elements with non-matching role', () => {
			const html = '<p class="@backend">Backend only</p><p>Common</p>'
			const result = filterByRole(html, createContext('frontend'))
			const doc = parseHtml(result)

			// Verify only common element remains
			expect(doc.body.children.length).toBe(1)
			const p = doc.body.children[0] as Element
			expect(p.tagName).toBe('P')
			expect(p.hasAttribute('class')).toBe(false)
			expect(p.textContent).toBe('Common')
		})

		it('handles multiple role classes on same element', () => {
			const html = '<p class="@frontend @fullstack">Shared content</p>'
			const result = filterByRole(html, createContext('fullstack'))
			const doc = parseHtml(result)

			// Verify element is kept with all classes preserved
			expect(doc.body.children.length).toBe(1)
			const p = doc.body.children[0] as Element
			expect(p.tagName).toBe('P')
			expect(p.getAttribute('class')).toBe('@frontend @fullstack')
			expect(p.textContent).toBe('Shared content')
		})
	})

	describe('filtering various element types', () => {
		it.each([
			['paragraph', '<p class="@frontend">Text</p>', 'p'],
			['list item', '<li class="@frontend">Item</li>', 'li'],
			['div', '<div class="@frontend">Content</div>', 'div'],
			['span', '<span class="@frontend">Inline</span>', 'span'],
			['section', '<section class="@frontend">Section</section>', 'section'],
		])('filters %s elements correctly', (_, html, selector) => {
			const result = filterByRole(html, createContext('frontend'))
			const doc = parseHtml(result)

			expect(doc.querySelector(selector)).toBeTruthy()
		})

		it.each([
			['paragraph', '<p class="@backend">Text</p>'],
			['list item', '<li class="@backend">Item</li>'],
			['div', '<div class="@backend">Content</div>'],
		])('removes non-matching %s elements', (_, html) => {
			const result = filterByRole(html, createContext('frontend'))
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(0)
		})
	})

	describe('nested elements', () => {
		it('removes parent element with role, removing all children', () => {
			const html =
				'<div class="@backend"><p>Nested paragraph</p><span>Nested span</span></div>'
			const result = filterByRole(html, createContext('frontend'))
			const doc = parseHtml(result)

			// Verify entire div and its children are removed
			expect(doc.body.children.length).toBe(0)
		})

		it('keeps parent with matching role and all children', () => {
			const html =
				'<div class="@frontend"><p>Nested paragraph</p><ul><li>Item</li></ul></div>'
			const result = filterByRole(html, createContext('frontend'))
			const doc = parseHtml(result)

			// Verify complete nested structure is preserved
			expect(doc.body.children.length).toBe(1)
			const div = doc.body.children[0] as Element
			expect(div.tagName).toBe('DIV')
			expect(div.getAttribute('class')).toBe('@frontend')
			expect(div.children.length).toBe(2)

			const p = div.children[0] as Element
			expect(p.tagName).toBe('P')
			expect(p.textContent).toBe('Nested paragraph')

			const ul = div.children[1] as Element
			expect(ul.tagName).toBe('UL')
			expect(ul.children.length).toBe(1)
			expect(ul.children[0].tagName).toBe('LI')
			expect(ul.children[0].textContent).toBe('Item')
		})

		it('handles mixed role content in siblings', () => {
			const html = `
				<p>Common intro</p>
				<p class="@frontend">Frontend specific</p>
				<p class="@backend">Backend specific</p>
				<p>Common outro</p>
			`
			const result = filterByRole(html, createContext('frontend'))
			const doc = parseHtml(result)

			// Verify exactly 3 paragraphs remain in correct order
			const paragraphs = doc.querySelectorAll('p')
			expect(paragraphs.length).toBe(3)

			expect(paragraphs[0].hasAttribute('class')).toBe(false)
			expect(paragraphs[0].textContent).toBe('Common intro')

			expect(paragraphs[1].getAttribute('class')).toBe('@frontend')
			expect(paragraphs[1].textContent).toBe('Frontend specific')

			expect(paragraphs[2].hasAttribute('class')).toBe(false)
			expect(paragraphs[2].textContent).toBe('Common outro')
		})
	})

	describe('role name variations', () => {
		it.each([
			['simple', 'frontend', 'frontend'],
			['hyphenated', 'ui-design', 'ui-design'],
			['underscored', 'data_science', 'data_science'],
			['numeric suffix', 'role1', 'role1'],
			['camelCase', 'fullStack', 'fullStack'],
		])('handles %s role names: %s', (_, roleName, activeRole) => {
			const html = `<p class="@${roleName}">Content</p>`
			const result = filterByRole(html, createContext(activeRole))
			const doc = parseHtml(result)

			expect(doc.querySelector('p')).toBeTruthy()
		})
	})

	describe('class attribute preservation', () => {
		it('preserves other classes on kept elements', () => {
			const html = '<p class="text-blue-500 @frontend font-bold">Styled</p>'
			const result = filterByRole(html, createContext('frontend'))
			const doc = parseHtml(result)

			const p = doc.querySelector('p')
			const classes = p?.getAttribute('class')
			expect(classes).toContain('text-blue-500')
			expect(classes).toContain('font-bold')
			expect(classes).toContain('@frontend')
		})
	})

	describe('composed roles via roleMap', () => {
		function createContextWithMap(
			activeRole: string,
			roleMap: Record<string, string[]>,
		): PipelineContext {
			return {
				config: { activeRole, roleMap },
				env: { css: '' },
			}
		}

		it('keeps frontend-tagged content when active role is composed fullstack', () => {
			const html =
				'<p class="@frontend">Frontend</p><p class="@backend">Backend</p><p class="@devops">DevOps</p>'
			const ctx = createContextWithMap('fullstack', {
				fullstack: ['frontend', 'backend'],
			})
			const result = filterByRole(html, ctx)
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(2)
			expect(doc.querySelectorAll('.\\@frontend').length).toBe(1)
			expect(doc.querySelectorAll('.\\@backend').length).toBe(1)
		})

		it('keeps explicitly tagged fullstack content alongside constituents', () => {
			const html =
				'<p class="@fullstack">Explicit fullstack</p><p class="@frontend">Frontend</p>'
			const ctx = createContextWithMap('fullstack', {
				fullstack: ['frontend', 'backend'],
			})
			const result = filterByRole(html, ctx)
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(2)
		})

		it('keeps common (untagged) content with composed roles', () => {
			const html =
				'<p>Common</p><p class="@frontend">Frontend</p><p class="@devops">DevOps</p>'
			const ctx = createContextWithMap('fullstack', {
				fullstack: ['frontend', 'backend'],
			})
			const result = filterByRole(html, ctx)
			const doc = parseHtml(result)

			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['Common', 'Frontend'])
		})

		it('expands recursively through nested compositions', () => {
			const html =
				'<p class="@frontend">FE</p><p class="@backend">BE</p><p class="@leadership">Lead</p><p class="@devops">Ops</p>'
			const ctx = createContextWithMap('startup-cto', {
				fullstack: ['frontend', 'backend'],
				'startup-cto': ['fullstack', 'leadership'],
			})
			const result = filterByRole(html, ctx)
			const doc = parseHtml(result)

			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['FE', 'BE', 'Lead'])
		})

		it('falls back to simple filtering when roleMap has no entry for active role', () => {
			const html =
				'<p class="@frontend">Frontend</p><p class="@backend">Backend</p>'
			const ctx = createContextWithMap('frontend', {
				fullstack: ['frontend', 'backend'],
			})
			const result = filterByRole(html, ctx)
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(1)
			expect(doc.body.children[0].textContent).toBe('Frontend')
		})

		it('handles empty roleMap same as no roleMap', () => {
			const html =
				'<p class="@frontend">Frontend</p><p class="@backend">Backend</p>'
			const ctx = createContextWithMap('frontend', {})
			const result = filterByRole(html, ctx)
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(1)
			expect(doc.body.children[0].textContent).toBe('Frontend')
		})
	})

	describe('edge cases', () => {
		it('handles empty input', () => {
			const result = filterByRole('', createContext('frontend'))
			expect(result).toBe('')
		})

		it('handles content with no role classes', () => {
			const html = '<p>Just regular content</p><div>More content</div>'
			const result = filterByRole(html, createContext('frontend'))
			const doc = parseHtml(result)

			expect(doc.querySelector('p')?.textContent).toBe('Just regular content')
			expect(doc.querySelector('div')?.textContent).toBe('More content')
		})

		it('handles role class without colon (should not match)', () => {
			const html = '<p class="rolefrontend">Not a role</p>'
			const result = filterByRole(html, createContext('frontend'))
			const doc = parseHtml(result)

			// Element should be kept because it doesn't have @X pattern
			expect(doc.querySelector('p')).toBeTruthy()
		})
	})
})
