import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { filterByTag } from './index.js'

// =============================================================================
// Test Utilities
// =============================================================================

function parseHtml(html: string) {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!
	return {
		body: root,
		querySelector: (selector: string) => root.querySelector(selector),
		querySelectorAll: (selector: string) => root.querySelectorAll(selector),
	}
}

function run(
	html: string,
	activeTag?: string,
	tagMap?: Record<string, string[]>,
	contentTags?: string[],
): string {
	const selects = activeTag ? [activeTag] : null
	return filterByTag(selects, tagMap, contentTags)(html)
}

// =============================================================================
// Tests: filterByTag
// =============================================================================

describe('filterByTag', () => {
	describe('when no activeTag is specified', () => {
		it('returns unchanged when selects is null', () => {
			const html = '<p class="@frontend">Frontend</p><p>Common</p>'
			const result = run(html)

			expect(result).toBe(html)
		})
	})

	describe('filtering behavior', () => {
		it('keeps elements matching active target', () => {
			const html =
				'<p class="@frontend">Frontend content</p><p class="@backend">Backend content</p>'
			const result = run(html, 'frontend')
			const doc = parseHtml(result)

			// Verify exact DOM structure: only frontend element remains
			expect(doc.body.children.length).toBe(1)
			const p = doc.body.children[0] as Element
			expect(p.tagName).toBe('P')
			expect(p.getAttribute('class')).toBe('@frontend')
			expect(p.textContent).toBe('Frontend content')
		})

		it('keeps elements without target class (common content)', () => {
			const html = '<p class="@frontend">Frontend</p><p>Common content</p>'
			const result = run(html, 'frontend')
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

		it('removes elements with non-matching target', () => {
			const html = '<p class="@backend">Backend only</p><p>Common</p>'
			const result = run(html, 'frontend')
			const doc = parseHtml(result)

			// Verify only common element remains
			expect(doc.body.children.length).toBe(1)
			const p = doc.body.children[0] as Element
			expect(p.tagName).toBe('P')
			expect(p.hasAttribute('class')).toBe(false)
			expect(p.textContent).toBe('Common')
		})

		it('handles multiple target classes on same element', () => {
			const html = '<p class="@frontend @fullstack">Shared content</p>'
			const result = run(html, 'fullstack')
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
			const result = run(html, 'frontend')
			const doc = parseHtml(result)

			expect(doc.querySelector(selector)).toBeTruthy()
		})

		it.each([
			['paragraph', '<p class="@backend">Text</p>'],
			['list item', '<li class="@backend">Item</li>'],
			['div', '<div class="@backend">Content</div>'],
		])('removes non-matching %s elements', (_, html) => {
			const result = run(html, 'frontend')
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(0)
		})
	})

	describe('nested elements', () => {
		it('removes parent element with target, removing all children', () => {
			const html =
				'<div class="@backend"><p>Nested paragraph</p><span>Nested span</span></div>'
			const result = run(html, 'frontend')
			const doc = parseHtml(result)

			// Verify entire div and its children are removed
			expect(doc.body.children.length).toBe(0)
		})

		it('keeps parent with matching target and all children', () => {
			const html =
				'<div class="@frontend"><p>Nested paragraph</p><ul><li>Item</li></ul></div>'
			const result = run(html, 'frontend')
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

		it('handles mixed target content in siblings', () => {
			const html = `
				<p>Common intro</p>
				<p class="@frontend">Frontend specific</p>
				<p class="@backend">Backend specific</p>
				<p>Common outro</p>
			`
			const result = run(html, 'frontend')
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

	describe('tag name variations', () => {
		it.each([
			['simple', 'frontend', 'frontend'],
			['hyphenated', 'ui-design', 'ui-design'],
			['underscored', 'data_science', 'data_science'],
			['numeric suffix', 'role1', 'role1'],
			['camelCase', 'fullStack', 'fullStack'],
		])('handles %s tag names: %s', (_, tagName, activeTag) => {
			const html = `<p class="@${tagName}">Content</p>`
			const result = run(html, activeTag)
			const doc = parseHtml(result)

			expect(doc.querySelector('p')).toBeTruthy()
		})
	})

	describe('class attribute preservation', () => {
		it('preserves other classes on kept elements', () => {
			const html = '<p class="text-blue-500 @frontend font-bold">Styled</p>'
			const result = run(html, 'frontend')
			const doc = parseHtml(result)

			const p = doc.querySelector('p')
			const classes = p?.getAttribute('class')
			expect(classes).toContain('text-blue-500')
			expect(classes).toContain('font-bold')
			expect(classes).toContain('@frontend')
		})
	})

	describe('composed tags via tagMap', () => {
		it('keeps frontend-tagged content when active target is composed fullstack', () => {
			const html =
				'<p class="@frontend">Frontend</p><p class="@backend">Backend</p><p class="@devops">DevOps</p>'
			const result = run(html, 'fullstack', {
				fullstack: ['frontend', 'backend'],
			})
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(2)
			expect(doc.querySelectorAll('.\\@frontend').length).toBe(1)
			expect(doc.querySelectorAll('.\\@backend').length).toBe(1)
		})

		it('keeps explicitly tagged fullstack content alongside constituents', () => {
			const html =
				'<p class="@fullstack">Explicit fullstack</p><p class="@frontend">Frontend</p>'
			const result = run(html, 'fullstack', {
				fullstack: ['frontend', 'backend'],
			})
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(2)
		})

		it('keeps common (untagged) content with composed targets', () => {
			const html =
				'<p>Common</p><p class="@frontend">Frontend</p><p class="@devops">DevOps</p>'
			const result = run(html, 'fullstack', {
				fullstack: ['frontend', 'backend'],
			})
			const doc = parseHtml(result)

			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['Common', 'Frontend'])
		})

		it('expands recursively through nested compositions', () => {
			const html =
				'<p class="@frontend">FE</p><p class="@backend">BE</p><p class="@leadership">Lead</p><p class="@devops">Ops</p>'
			const result = run(html, 'startup-cto', {
				fullstack: ['frontend', 'backend'],
				'startup-cto': ['fullstack', 'leadership'],
			})
			const doc = parseHtml(result)

			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['FE', 'BE', 'Lead'])
		})

		it('falls back to simple filtering when tagMap has no entry for active target', () => {
			const html =
				'<p class="@frontend">Frontend</p><p class="@backend">Backend</p>'
			const result = run(html, 'frontend', {
				fullstack: ['frontend', 'backend'],
			})
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(1)
			expect(doc.body.children[0].textContent).toBe('Frontend')
		})

		it('handles empty tagMap same as no tagMap', () => {
			const html =
				'<p class="@frontend">Frontend</p><p class="@backend">Backend</p>'
			const result = run(html, 'frontend', {})
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(1)
			expect(doc.body.children[0].textContent).toBe('Frontend')
		})
	})

	describe('multi-select via composition', () => {
		it('selects: [backend] keeps untagged + @backend content', () => {
			const html =
				'<p>Common</p><p class="@backend">Backend</p><p class="@frontend">Frontend</p>'
			const result = filterByTag(['backend'])(html)
			const doc = parseHtml(result)

			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['Common', 'Backend'])
		})

		it('selects: [fullstack, frontend, backend] via tagMap keeps both tags', () => {
			const html =
				'<p>Common</p><p class="@frontend">FE</p><p class="@backend">BE</p><p class="@devops">Ops</p>'
			const tagMap = { fullstack: ['frontend', 'backend'] }
			const result = filterByTag(
				['fullstack', 'frontend', 'backend'],
				tagMap,
			)(html)
			const doc = parseHtml(result)

			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['Common', 'FE', 'BE'])
		})

		it('selects: null passes all content through (no filtering)', () => {
			const html =
				'<p>Common</p><p class="@frontend">FE</p><p class="@backend">BE</p>'
			const result = filterByTag(null)(html)
			expect(result).toBe(html)
		})
	})

	describe('hierarchical tags', () => {
		const contentTags = [
			'backend',
			'backend/node',
			'backend/jvm',
			'frontend',
			'frontend/react',
			'leadership',
		]

		it('child view includes ancestor content', () => {
			const html =
				'<p class="@backend">REST APIs</p><p class="@backend/node">Express</p><p class="@backend/jvm">Spring</p><p>Common</p>'
			const result = run(html, 'backend/node', {}, contentTags)
			const doc = parseHtml(result)
			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['REST APIs', 'Express', 'Common'])
		})

		it('parent view includes all descendant content', () => {
			const html =
				'<p class="@backend">REST APIs</p><p class="@backend/node">Express</p><p class="@backend/jvm">Spring</p><p>Common</p>'
			const result = run(html, 'backend', {}, contentTags)
			const doc = parseHtml(result)
			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['REST APIs', 'Express', 'Spring', 'Common'])
		})

		it('siblings are excluded from child view', () => {
			const html =
				'<p class="@backend/node">Express</p><p class="@backend/jvm">Spring</p><p class="@frontend">React</p>'
			const result = run(html, 'backend/node', {}, contentTags)
			const doc = parseHtml(result)
			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['Express'])
		})

		it('flat tags are unaffected by hierarchy', () => {
			const html =
				'<p class="@leadership">Leading</p><p class="@frontend">FE</p><p>Common</p>'
			const result = run(html, 'leadership', {}, contentTags)
			const doc = parseHtml(result)
			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['Leading', 'Common'])
		})

		it('composition with hierarchical constituents expands correctly', () => {
			const html =
				'<p class="@frontend">FE</p><p class="@frontend/react">React</p><p class="@backend">BE generic</p><p class="@backend/node">Node</p><p class="@backend/jvm">JVM</p><p>Common</p>'
			const result = run(
				html,
				'stripe',
				{ stripe: ['frontend/react', 'backend/node'] },
				contentTags,
			)
			const doc = parseHtml(result)
			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['FE', 'React', 'BE generic', 'Node', 'Common'])
		})

		it('composition does not cascade: ancestor from child does not pull siblings', () => {
			const html =
				'<p class="@backend/node">Node</p><p class="@backend/jvm">JVM</p>'
			const result = run(
				html,
				'stripe',
				{ stripe: ['backend/node'] },
				contentTags,
			)
			const doc = parseHtml(result)
			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['Node'])
		})

		it('redundant ancestor+descendant on same element is kept', () => {
			const html = '<p class="@backend @backend/node">Both tags</p>'
			const result = run(html, 'backend/node', {}, contentTags)
			const doc = parseHtml(result)
			expect(doc.body.children.length).toBe(1)
			expect(doc.body.children[0].textContent).toBe('Both tags')
		})

		it('orphan hierarchy works (child exists without parent content)', () => {
			const orphanTags = ['backend/node', 'backend/jvm']
			const html =
				'<p class="@backend/node">Node</p><p class="@backend/jvm">JVM</p>'
			const result = run(html, 'backend/node', {}, orphanTags)
			const doc = parseHtml(result)
			expect(doc.body.children.length).toBe(1)
			expect(doc.body.children[0].textContent).toBe('Node')
		})

		it('does not confuse @backend-legacy with @backend', () => {
			const html =
				'<p class="@backend">Backend</p><p class="@backend-legacy">Legacy</p>'
			const tags = ['backend', 'backend-legacy', 'backend/node']
			const result = run(html, 'backend/node', {}, tags)
			const doc = parseHtml(result)
			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['Backend'])
		})

		it('three-level depth: mid-level view includes ancestor and descendants', () => {
			const deepTags = [
				'data',
				'data/ml',
				'data/ml/nlp',
				'data/ml/cv',
				'data/analytics',
			]
			const html =
				'<p class="@data">Data generic</p><p class="@data/ml">ML</p><p class="@data/ml/nlp">NLP</p><p class="@data/ml/cv">CV</p><p class="@data/analytics">Analytics</p>'
			const result = run(html, 'data/ml', {}, deepTags)
			const doc = parseHtml(result)
			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toEqual(['Data generic', 'ML', 'NLP', 'CV'])
		})

		it('trailing slash is treated as a distinct tag (does not match parent)', () => {
			const html =
				'<p class="@backend/">Trailing slash</p><p class="@backend">Backend</p>'
			const tags = ['backend', 'backend/', 'backend/node']
			const result = run(html, 'backend', {}, tags)
			const doc = parseHtml(result)
			const texts = Array.from(doc.body.children).map(el => el.textContent)
			expect(texts).toContain('Backend')
		})
	})

	describe('edge cases', () => {
		it('handles empty input', () => {
			const result = filterByTag(['frontend'])('')
			expect(result).toBe('')
		})

		it('handles content with no target classes', () => {
			const html = '<p>Just regular content</p><div>More content</div>'
			const result = run(html, 'frontend')
			const doc = parseHtml(result)

			expect(doc.querySelector('p')?.textContent).toBe('Just regular content')
			expect(doc.querySelector('div')?.textContent).toBe('More content')
		})

		it('handles target class without colon (should not match)', () => {
			const html = '<p class="rolefrontend">Not a target</p>'
			const result = run(html, 'frontend')
			const doc = parseHtml(result)

			// Element should be kept because it doesn't have @X pattern
			expect(doc.querySelector('p')).toBeTruthy()
		})
	})
})
