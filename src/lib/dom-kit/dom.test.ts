import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { collectSiblings, serializeElements, withDOM } from './dom.js'

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Create a DOM with sibling elements for testing.
 * Returns the parent container and a map of elements by tag name.
 */
function createSiblings(html: string) {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!
	return { root, document }
}

/**
 * Parse an HTML string into a DOM for assertion.
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
 * Extract tag names from element array for easy assertion.
 */
function tags(elements: Element[]): string[] {
	return elements.map(el => el.tagName.toLowerCase())
}

/**
 * Extract text content from element array for easy assertion.
 */
function texts(elements: Element[]): string[] {
	return elements.map(el => el.textContent || '')
}

// =============================================================================
// Tests: collectSiblings
// =============================================================================

describe('collectSiblings', () => {
	describe('basic collection (no until, no filter)', () => {
		it('collects all siblings from start to end', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			const result = collectSiblings(root.firstElementChild)

			expect(result.length).toBe(3)
			expect(texts(result)).toEqual(['A', 'B', 'C'])
		})

		it('collects a single element', () => {
			const { root } = createSiblings('<p>Only</p>')
			const result = collectSiblings(root.firstElementChild)

			expect(result.length).toBe(1)
			expect(texts(result)).toEqual(['Only'])
		})

		it('returns empty array when start is null', () => {
			const result = collectSiblings(null)
			expect(result).toEqual([])
		})
	})

	describe('until element', () => {
		it('stops before the until element (exclusive)', () => {
			const { root } = createSiblings('<p>A</p><h2>Stop</h2><p>B</p>')
			const h2 = root.querySelector('h2')!
			const result = collectSiblings(root.firstElementChild, h2)

			expect(result.length).toBe(1)
			expect(texts(result)).toEqual(['A'])
		})

		it('returns empty array when start equals until', () => {
			const { root } = createSiblings('<h2>Stop</h2><p>After</p>')
			const h2 = root.querySelector('h2')!
			const result = collectSiblings(h2, h2)

			expect(result).toEqual([])
		})

		it('collects all when until element is not a sibling', () => {
			const { root, document } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			// Create a detached element not in the DOM
			const detached = document.createElement('div')
			const result = collectSiblings(root.firstElementChild, detached)

			expect(result.length).toBe(3)
			expect(texts(result)).toEqual(['A', 'B', 'C'])
		})

		it('collects all when until is null', () => {
			const { root } = createSiblings('<p>A</p><p>B</p>')
			const result = collectSiblings(root.firstElementChild, null)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})

		it('collects all when until is undefined', () => {
			const { root } = createSiblings('<p>A</p><p>B</p>')
			const result = collectSiblings(root.firstElementChild, undefined)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})

		it('stops at the first occurrence of until element', () => {
			const { root } = createSiblings('<p>A</p><hr><p>B</p><hr><p>C</p>')
			const firstHr = root.querySelector('hr')!
			const result = collectSiblings(root.firstElementChild, firstHr)

			expect(result.length).toBe(1)
			expect(texts(result)).toEqual(['A'])
		})

		it('returns empty array when until is the first element', () => {
			const { root } = createSiblings('<h2>First</h2><p>A</p><p>B</p>')
			const h2 = root.querySelector('h2')!
			const result = collectSiblings(root.firstElementChild, h2)

			expect(result).toEqual([])
		})
	})

	describe('until predicate', () => {
		it('stops when predicate returns true (exclusive)', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><h2>Stop</h2><p>C</p>')
			const result = collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2',
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})

		it('includes start element even when it matches predicate', () => {
			const { root } = createSiblings('<h2>Start</h2><p>A</p>')
			const result = collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2',
			)

			// Predicate skips first element — h2 is included, stops at end
			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['Start', 'A'])
		})

		it('stops at second element when it matches predicate', () => {
			const { root } = createSiblings('<h2>First</h2><h2>Second</h2><p>A</p>')
			const result = collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2',
			)

			// First h2 included (start), second h2 triggers stop
			expect(result.length).toBe(1)
			expect(texts(result)).toEqual(['First'])
		})

		it('collects all when predicate never matches', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			const result = collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2',
			)

			expect(result.length).toBe(3)
			expect(texts(result)).toEqual(['A', 'B', 'C'])
		})

		it('stops at any of multiple tag conditions', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><hr><p>C</p>')
			const result = collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2' || el.tagName === 'HR',
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})
	})

	describe('filter', () => {
		it('only includes elements matching filter', () => {
			const { root } = createSiblings('<h1>Title</h1><p>A</p><p>B</p>')
			const result = collectSiblings(
				root.firstElementChild,
				undefined,
				el => el.tagName === 'P',
			)

			expect(result.length).toBe(2)
			expect(tags(result)).toEqual(['p', 'p'])
		})

		it('returns empty when no element matches filter', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			const result = collectSiblings(
				root.firstElementChild,
				undefined,
				el => el.tagName === 'H3',
			)

			expect(result).toEqual([])
		})

		it('filter does not affect traversal', () => {
			const { root } = createSiblings(
				'<h1>Title</h1><p>A</p><h1>Title2</h1><p>B</p>',
			)
			// Filter out h1s but still traverse past them
			const result = collectSiblings(
				root.firstElementChild,
				undefined,
				el => el.tagName !== 'H1',
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})
	})

	describe('until + filter combined', () => {
		it('stops at until and filters within range', () => {
			const { root } = createSiblings(
				'<h1>Name</h1><p>A</p><p>B</p><h2>Section</h2><p>C</p>',
			)
			const h2 = root.querySelector('h2')!
			const result = collectSiblings(
				root.firstElementChild,
				h2,
				el => el.tagName !== 'H1',
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})

		it('predicate until with filter', () => {
			const { root } = createSiblings(
				'<h1>Name</h1><p>A</p><hr><p>B</p><h2>Section</h2>',
			)
			const result = collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2',
				el => el.tagName !== 'H1' && el.tagName !== 'HR',
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})

		it('filter does not prevent until from being checked', () => {
			const { root } = createSiblings('<p>A</p><h2>Stop</h2><p>B</p>')
			// Filter would exclude h2, but until should still stop at it
			const result = collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2',
				el => el.tagName === 'P',
			)

			expect(result.length).toBe(1)
			expect(texts(result)).toEqual(['A'])
		})
	})

	describe('starting from middle of siblings', () => {
		it('collects from a middle sibling to end', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p><p>D</p>')
			const second = root.firstElementChild!.nextElementSibling!
			const result = collectSiblings(second)

			expect(result.length).toBe(3)
			expect(texts(result)).toEqual(['B', 'C', 'D'])
		})

		it('collects from a middle sibling with until', () => {
			const { root } = createSiblings(
				'<h2>H2-1</h2><p>A</p><p>B</p><h2>H2-2</h2><p>C</p>',
			)
			const firstH2 = root.querySelector('h2')!
			const start = firstH2.nextElementSibling!
			const result = collectSiblings(start, el => el.tagName === 'H2')

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})
	})

	describe('element identity', () => {
		it('returns the exact same element references', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			const result = collectSiblings(root.firstElementChild)

			expect(result[0]).toBe(root.children[0])
			expect(result[1]).toBe(root.children[1])
			expect(result[2]).toBe(root.children[2])
		})

		it('until checks by identity, not equality', () => {
			const { root, document } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			// Create a different <p> with same content — should not match
			const lookalike = document.createElement('p')
			lookalike.textContent = 'B'
			const result = collectSiblings(root.firstElementChild, lookalike)

			// Should collect all because lookalike is not the same object
			expect(result.length).toBe(3)
		})
	})

	describe('element ref vs predicate asymmetry', () => {
		it('element ref stops at start when start === until', () => {
			const { root } = createSiblings('<h2>X</h2><p>A</p>')
			const h2 = root.querySelector('h2')!
			const result = collectSiblings(h2, h2)

			expect(result).toEqual([])
		})

		it('predicate includes start even when start matches', () => {
			const { root } = createSiblings('<h2>X</h2><p>A</p>')
			const result = collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2',
			)

			// Predicate skips first element — h2 is included
			expect(result.length).toBe(2)
			expect(tags(result)).toEqual(['h2', 'p'])
		})

		it('same landmark: element ref = empty, predicate = includes start', () => {
			const { root } = createSiblings('<h2>Sec1</h2><p>A</p><h2>Sec2</h2>')
			const h2 = root.querySelector('h2')!

			const byRef = collectSiblings(h2, h2)
			const byPred = collectSiblings(h2, el => el.tagName === 'H2')

			expect(byRef).toEqual([])
			expect(byPred.length).toBe(2)
			expect(texts(byPred)).toEqual(['Sec1', 'A'])
		})
	})

	describe('edge cases: empty & degenerate inputs', () => {
		it('returns empty for container with no children', () => {
			const { root } = createSiblings('')
			const result = collectSiblings(root.firstElementChild)

			expect(result).toEqual([])
		})

		it('null start with until element still returns empty', () => {
			const { root } = createSiblings('<p>A</p>')
			const p = root.querySelector('p')!
			const result = collectSiblings(null, p)

			expect(result).toEqual([])
		})

		it('null start with until predicate still returns empty', () => {
			const result = collectSiblings(null, () => true)
			expect(result).toEqual([])
		})

		it('null start with filter still returns empty', () => {
			const result = collectSiblings(null, undefined, () => true)
			expect(result).toEqual([])
		})

		it('null start with all three params returns empty', () => {
			const result = collectSiblings(null, null, () => true)
			expect(result).toEqual([])
		})
	})

	describe('edge cases: until boundary conditions', () => {
		it('until is the very last sibling — collects everything before it', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><h2>Last</h2>')
			const last = root.lastElementChild!
			const result = collectSiblings(root.firstElementChild, last)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})

		it('until element is before start — collects all (never found)', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p><p>D</p>')
			const first = root.children[0]!
			const third = root.children[2]!
			// Start from C, until is A (which is before C in DOM order)
			const result = collectSiblings(third, first)

			// A is never encountered walking forward from C
			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['C', 'D'])
		})

		it('until element is a descendant, not a sibling — collects all', () => {
			const { root } = createSiblings(
				'<div><span>Inside</span></div><p>A</p><p>B</p>',
			)
			const nested = root.querySelector('span')!
			const result = collectSiblings(root.firstElementChild, nested)

			// span is nested inside div, not a sibling — never matched
			expect(result.length).toBe(3)
		})

		it('until element is an ancestor — collects all', () => {
			const { root } = createSiblings('<p>A</p><p>B</p>')
			// root is the parent, not a sibling
			const result = collectSiblings(root.firstElementChild, root)

			expect(result.length).toBe(2)
		})

		it('until element is from a completely different DOM tree', () => {
			const { root } = createSiblings('<p>A</p><p>B</p>')
			const { root: otherRoot } = createSiblings('<p>A</p>')
			const foreignEl = otherRoot.firstElementChild!

			const result = collectSiblings(root.firstElementChild, foreignEl)

			// Different object identity — never matched
			expect(result.length).toBe(2)
		})
	})

	describe('edge cases: until predicate boundary conditions', () => {
		it('predicate that always returns true — includes only start', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			const result = collectSiblings(root.firstElementChild, () => true)

			// First element skips predicate, second element triggers stop
			expect(result.length).toBe(1)
			expect(texts(result)).toEqual(['A'])
		})

		it('predicate that always returns false — collects all', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			const result = collectSiblings(root.firstElementChild, () => false)

			expect(result.length).toBe(3)
		})

		it('predicate matches only the very last sibling', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><h2>Last</h2>')
			const result = collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2',
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})

		it('predicate based on text content, not tag', () => {
			const { root } = createSiblings(
				'<p>keep</p><p>keep</p><p>STOP</p><p>skip</p>',
			)
			const result = collectSiblings(
				root.firstElementChild,
				el => el.textContent === 'STOP',
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['keep', 'keep'])
		})

		it('predicate based on attributes', () => {
			const { root } = createSiblings(
				'<p>A</p><p>B</p><p data-stop="true">C</p><p>D</p>',
			)
			const result = collectSiblings(root.firstElementChild, el =>
				el.hasAttribute('data-stop'),
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})
	})

	describe('edge cases: filter boundary conditions', () => {
		it('filter that always returns false — empty result', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			const result = collectSiblings(
				root.firstElementChild,
				undefined,
				() => false,
			)

			expect(result).toEqual([])
		})

		it('filter that always returns true — same as no filter', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			const withFilter = collectSiblings(
				root.firstElementChild,
				undefined,
				() => true,
			)
			const noFilter = collectSiblings(root.firstElementChild)

			expect(withFilter.length).toBe(noFilter.length)
			expect(texts(withFilter)).toEqual(texts(noFilter))
		})

		it('filter excludes all but one element', () => {
			const { root } = createSiblings(
				'<p>A</p><div>B</div><p>C</p><span>D</span><p>E</p>',
			)
			const result = collectSiblings(
				root.firstElementChild,
				undefined,
				el => el.tagName === 'DIV',
			)

			expect(result.length).toBe(1)
			expect(texts(result)).toEqual(['B'])
		})

		it('filter skips start element but includes later ones', () => {
			const { root } = createSiblings('<h1>Skip</h1><p>Keep</p><p>Keep2</p>')
			const result = collectSiblings(
				root.firstElementChild,
				undefined,
				el => el.tagName !== 'H1',
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['Keep', 'Keep2'])
		})

		it('filter based on class name', () => {
			const { root } = createSiblings(
				'<p class="keep">A</p><p>B</p><p class="keep">C</p>',
			)
			const result = collectSiblings(root.firstElementChild, undefined, el =>
				el.classList.contains('keep'),
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'C'])
		})

		it('filter excludes consecutive elements in the middle', () => {
			const { root } = createSiblings('<p>A</p><hr><hr><hr><p>B</p>')
			const result = collectSiblings(
				root.firstElementChild,
				undefined,
				el => el.tagName !== 'HR',
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})
	})

	describe('edge cases: self-closing & empty elements', () => {
		it('collects self-closing elements (br, hr, img)', () => {
			const { root } = createSiblings('<p>A</p><br><hr><img src="x"><p>B</p>')
			const result = collectSiblings(root.firstElementChild)

			expect(result.length).toBe(5)
			expect(tags(result)).toEqual(['p', 'br', 'hr', 'img', 'p'])
		})

		it('collects elements with empty text content', () => {
			const { root } = createSiblings('<p></p><p></p><p></p>')
			const result = collectSiblings(root.firstElementChild)

			expect(result.length).toBe(3)
			expect(texts(result)).toEqual(['', '', ''])
		})
	})

	describe('edge cases: does not traverse into children', () => {
		it('only collects direct siblings, not nested descendants', () => {
			const { root } = createSiblings(
				'<div><p>Nested</p><p>Also Nested</p></div><p>Sibling</p>',
			)
			const result = collectSiblings(root.firstElementChild)

			// Only 2 direct children, not the nested <p>s
			expect(result.length).toBe(2)
			expect(tags(result)).toEqual(['div', 'p'])
		})

		it('until does not match nested elements', () => {
			const { root } = createSiblings(
				'<div><h2>Nested H2</h2></div><p>A</p><h2>Real H2</h2>',
			)
			const result = collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2',
			)

			// Should NOT stop at the nested h2, only the sibling h2
			expect(result.length).toBe(2)
			expect(tags(result)).toEqual(['div', 'p'])
		})
	})

	describe('edge cases: DOM text nodes between elements', () => {
		it('ignores text nodes — only walks element siblings', () => {
			const { root, document } = createSiblings('<p>A</p><p>B</p>')
			// Insert raw text node between the two <p>s
			root.insertBefore(
				document.createTextNode('raw text between'),
				root.children[1]!,
			)
			const result = collectSiblings(root.firstElementChild)

			// Text nodes are invisible to nextElementSibling
			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})
	})

	describe('edge cases: does not mutate the DOM', () => {
		it('DOM structure is unchanged after collection', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><h2>C</h2><p>D</p>')
			const originalHTML = root.innerHTML

			collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2',
				el => el.tagName === 'P',
			)

			expect(root.innerHTML).toBe(originalHTML)
		})
	})

	describe('edge cases: multiple calls & idempotency', () => {
		it('same call twice produces identical results', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><h2>C</h2>')
			const h2 = root.querySelector('h2')!
			const first = collectSiblings(root.firstElementChild, h2)
			const second = collectSiblings(root.firstElementChild, h2)

			expect(texts(first)).toEqual(texts(second))
			expect(first.length).toBe(second.length)
		})

		it('returns a new array each time (no shared references)', () => {
			const { root } = createSiblings('<p>A</p><p>B</p>')
			const first = collectSiblings(root.firstElementChild)
			const second = collectSiblings(root.firstElementChild)

			expect(first).not.toBe(second)
			// But elements inside are the same DOM nodes
			expect(first[0]).toBe(second[0])
		})
	})

	describe('edge cases: only start element matches', () => {
		it('start is the only element and until is null', () => {
			const { root } = createSiblings('<p>Only</p>')
			const result = collectSiblings(root.firstElementChild, null)

			expect(result.length).toBe(1)
			expect(texts(result)).toEqual(['Only'])
		})

		it('start is the only element and filter excludes it', () => {
			const { root } = createSiblings('<h1>Only</h1>')
			const result = collectSiblings(
				root.firstElementChild,
				undefined,
				el => el.tagName === 'P',
			)

			expect(result).toEqual([])
		})

		it('start is last sibling — gets only that one', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			const last = root.lastElementChild!
			const result = collectSiblings(last)

			expect(result.length).toBe(1)
			expect(texts(result)).toEqual(['C'])
		})
	})

	describe('edge cases: large sibling lists', () => {
		it('handles 100 siblings efficiently', () => {
			const html = Array.from({ length: 100 }, (_, i) => `<p>${i}</p>`).join('')
			const { root } = createSiblings(html)
			const result = collectSiblings(root.firstElementChild)

			expect(result.length).toBe(100)
			expect(texts(result)[0]).toBe('0')
			expect(texts(result)[99]).toBe('99')
		})

		it('handles 100 siblings with until at position 50', () => {
			const html = Array.from({ length: 100 }, (_, i) =>
				i === 50 ? '<h2>Stop</h2>' : `<p>${i}</p>`,
			).join('')
			const { root } = createSiblings(html)
			const result = collectSiblings(
				root.firstElementChild,
				el => el.tagName === 'H2',
			)

			expect(result.length).toBe(50)
		})
	})

	describe('edge cases: detached / orphaned elements', () => {
		it('works on a detached element with no siblings', () => {
			const { document } = createSiblings('')
			const orphan = document.createElement('p')
			orphan.textContent = 'Orphan'
			const result = collectSiblings(orphan)

			expect(result.length).toBe(1)
			expect(texts(result)).toEqual(['Orphan'])
		})

		it('works on an element removed from the DOM', () => {
			const { root } = createSiblings('<p>A</p><p>B</p><p>C</p>')
			const middle = root.children[1]!
			// Remove from DOM — it loses its siblings
			middle.remove()
			const result = collectSiblings(middle)

			expect(result.length).toBe(1)
			expect(texts(result)).toEqual(['B'])
		})
	})

	describe('real-world patterns', () => {
		it('extract-header: siblings before first h2', () => {
			const { root } = createSiblings(
				'<h1>Name</h1><p>Email</p><p>Phone</p><h2>Experience</h2><p>Job</p>',
			)
			const result = collectSiblings(
				root.firstElementChild,
				root.querySelector('h2'),
			)

			expect(result.length).toBe(3)
			expect(tags(result)).toEqual(['h1', 'p', 'p'])
		})

		it('wrap-sections: h2 content until next h2', () => {
			const { root } = createSiblings(
				'<h2>Sec1</h2><p>A</p><ul><li>B</li></ul><h2>Sec2</h2><p>C</p>',
			)
			const h2 = root.querySelector('h2')!
			const result = collectSiblings(
				h2,
				el => el.tagName === 'H2' || el.tagName === 'HR',
			)

			// Start h2 included (predicate skips first), stops at second h2
			expect(result.length).toBe(3)
			expect(tags(result)).toEqual(['h2', 'p', 'ul'])
		})

		it('wrap-entries: h3 content until next landmark', () => {
			const { root } = createSiblings(
				'<h3>Job1</h3><p>Details</p><ul><li>Task</li></ul><h3>Job2</h3><p>More</p>',
			)
			const h3 = root.querySelector('h3')!
			const result = collectSiblings(
				h3,
				el => el.tagName === 'H3' || el.tagName === 'H2' || el.tagName === 'HR',
			)

			// Start h3 included (predicate skips first), stops at second h3
			expect(result.length).toBe(3)
			expect(tags(result)).toEqual(['h3', 'p', 'ul'])
		})

		it('classify-header: elements before h2 excluding h1', () => {
			const { root } = createSiblings(
				'<h1>Name</h1><p>Email</p><blockquote>Links</blockquote><h2>Exp</h2>',
			)
			const result = collectSiblings(
				root.firstElementChild,
				root.querySelector('h2'),
				el => el.tagName.toLowerCase() !== 'h1',
			)

			expect(result.length).toBe(2)
			expect(tags(result)).toEqual(['p', 'blockquote'])
		})

		it('elements before hr excluding header', () => {
			const { root } = createSiblings(
				'<header>H</header><p>A</p><p>B</p><hr><p>C</p>',
			)
			const result = collectSiblings(
				root.firstElementChild,
				root.querySelector('hr'),
				el => el.tagName !== 'HEADER',
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['A', 'B'])
		})

		it('elements from hr to end excluding hrs', () => {
			const { root } = createSiblings('<p>A</p><hr><p>B</p><p>C</p>')
			const result = collectSiblings(
				root.querySelector('hr'),
				undefined,
				el => el.tagName !== 'HR',
			)

			expect(result.length).toBe(2)
			expect(texts(result)).toEqual(['B', 'C'])
		})
	})
})

// =============================================================================
// Tests: serializeElements
// =============================================================================

describe('serializeElements', () => {
	it('serializes multiple elements into a single HTML string', () => {
		const { root } = createSiblings('<p>A</p><p>B</p><p>C</p>')
		const elements = Array.from(root.children) as Element[]
		const result = serializeElements(elements)

		const doc = parseHtml(result)
		const ps = doc.querySelectorAll('p')
		expect(ps.length).toBe(3)
		expect(ps[0].textContent).toBe('A')
		expect(ps[1].textContent).toBe('B')
		expect(ps[2].textContent).toBe('C')
	})

	it('returns empty string for empty array', () => {
		const result = serializeElements([])
		expect(result).toBe('')
	})

	it('serializes a single element', () => {
		const { root } = createSiblings('<div class="box">Content</div>')
		const elements = [root.firstElementChild!]
		const result = serializeElements(elements)

		const doc = parseHtml(result)
		expect(doc.querySelector('.box')).toBeTruthy()
		expect(doc.querySelector('.box')?.textContent).toBe('Content')
	})

	it('preserves element attributes', () => {
		const { root } = createSiblings(
			'<a href="https://example.com" class="link">Click</a>',
		)
		const elements = [root.firstElementChild!]
		const result = serializeElements(elements)

		const doc = parseHtml(result)
		const link = doc.querySelector('a')
		expect(link?.getAttribute('href')).toBe('https://example.com')
		expect(link?.classList.contains('link')).toBe(true)
		expect(link?.textContent).toBe('Click')
	})

	it('preserves nested structure', () => {
		const { root } = createSiblings(
			'<div><ul><li>Item 1</li><li>Item 2</li></ul></div>',
		)
		const elements = [root.firstElementChild!]
		const result = serializeElements(elements)

		const doc = parseHtml(result)
		const items = doc.querySelectorAll('div ul li')
		expect(items.length).toBe(2)
		expect(items[0].textContent).toBe('Item 1')
		expect(items[1].textContent).toBe('Item 2')
	})

	it('concatenates without separators', () => {
		const { root } = createSiblings('<span>A</span><span>B</span>')
		const elements = Array.from(root.children) as Element[]
		const result = serializeElements(elements)

		// Verify the spans are directly adjacent
		const doc = parseHtml(result)
		const spans = doc.querySelectorAll('span')
		expect(spans.length).toBe(2)
	})

	it('handles self-closing elements', () => {
		const { root } = createSiblings('<br><hr><img src="x">')
		const elements = Array.from(root.children) as Element[]
		const result = serializeElements(elements)

		const doc = parseHtml(result)
		expect(doc.querySelector('br')).toBeTruthy()
		expect(doc.querySelector('hr')).toBeTruthy()
		expect(doc.querySelector('img')).toBeTruthy()
	})

	it('works with collectSiblings output', () => {
		const { root } = createSiblings(
			'<h1>Name</h1><p>Email</p><p>Phone</p><h2>Section</h2>',
		)
		const siblings = collectSiblings(
			root.firstElementChild,
			root.querySelector('h2'),
		)
		const result = serializeElements(siblings)

		const doc = parseHtml(result)
		expect(doc.querySelector('h1')?.textContent).toBe('Name')
		expect(doc.querySelectorAll('p').length).toBe(2)
		expect(doc.querySelector('h2')).toBeNull()
	})
})

// =============================================================================
// Tests: withDOM
// =============================================================================

describe('withDOM', () => {
	describe('basic parsing and serialization', () => {
		it('parses HTML and returns innerHTML when fn returns void', () => {
			const result = withDOM('<p>Hello</p>', () => {
				// no return — void
			})

			const doc = parseHtml(result)
			expect(doc.querySelector('p')?.textContent).toBe('Hello')
		})

		it('returns fn result when fn returns a string', () => {
			const result = withDOM('<p>Hello</p>', () => {
				return '<div>Custom</div>'
			})

			const doc = parseHtml(result)
			expect(doc.querySelector('div')?.textContent).toBe('Custom')
			// Original content should not appear since fn returned a string
			expect(doc.querySelector('p')).toBeNull()
		})

		it('returns empty string when fn returns empty string', () => {
			const result = withDOM('<p>Hello</p>', () => '')
			expect(result).toBe('')
		})
	})

	describe('DOM mutation via fn', () => {
		it('mutations to root are reflected in the output', () => {
			const result = withDOM('<p>Old</p>', (root, document) => {
				const div = document.createElement('div')
				div.className = 'new'
				div.textContent = 'Added'
				root.appendChild(div)
			})

			const doc = parseHtml(result)
			expect(doc.querySelector('p')?.textContent).toBe('Old')
			expect(doc.querySelector('.new')?.textContent).toBe('Added')
		})

		it('can remove elements from the DOM', () => {
			const result = withDOM(
				'<p>Keep</p><p class="remove">Remove</p>',
				root => {
					root.querySelector('.remove')?.remove()
				},
			)

			const doc = parseHtml(result)
			expect(doc.querySelectorAll('p').length).toBe(1)
			expect(doc.querySelector('p')?.textContent).toBe('Keep')
		})

		it('can modify element attributes', () => {
			const result = withDOM('<a href="old.html">Link</a>', root => {
				root.querySelector('a')?.setAttribute('href', 'new.html')
			})

			const doc = parseHtml(result)
			expect(doc.querySelector('a')?.getAttribute('href')).toBe('new.html')
		})

		it('can wrap elements', () => {
			const result = withDOM('<p>A</p><p>B</p>', (root, document) => {
				const wrapper = document.createElement('section')
				wrapper.className = 'wrapper'
				while (root.firstChild) {
					wrapper.appendChild(root.firstChild)
				}
				root.appendChild(wrapper)
			})

			const doc = parseHtml(result)
			const wrapper = doc.querySelector('.wrapper')
			expect(wrapper).toBeTruthy()
			expect(wrapper?.querySelectorAll('p').length).toBe(2)
			expect(wrapper?.parentElement).toBe(doc.body)
		})
	})

	describe('fn receives correct arguments', () => {
		it('root contains the parsed HTML content', () => {
			withDOM('<h1>Title</h1><p>Body</p>', root => {
				expect(root.querySelector('h1')?.textContent).toBe('Title')
				expect(root.querySelector('p')?.textContent).toBe('Body')
				expect(root.children.length).toBe(2)
			})
		})

		it('document can be used to create new elements', () => {
			const result = withDOM('<p>Existing</p>', (root, document) => {
				const span = document.createElement('span')
				span.textContent = 'Created'
				root.appendChild(span)
			})

			const doc = parseHtml(result)
			expect(doc.querySelector('span')?.textContent).toBe('Created')
		})
	})

	describe('edge cases', () => {
		it('handles empty HTML input', () => {
			const result = withDOM('', () => {})
			expect(result).toBe('')
		})

		it('handles complex nested HTML', () => {
			const html =
				'<div class="outer"><div class="inner"><ul><li>1</li><li>2</li></ul></div></div>'
			const result = withDOM(html, () => {})

			const doc = parseHtml(result)
			expect(doc.querySelector('.outer .inner ul')).toBeTruthy()
			expect(doc.querySelectorAll('.outer .inner ul li').length).toBe(2)
		})

		it('fn return value takes precedence over root.innerHTML', () => {
			const result = withDOM('<p>Root content</p>', root => {
				// Mutate root AND return a string — return value wins
				root.querySelector('p')!.textContent = 'Mutated'
				return '<span>Returned</span>'
			})

			const doc = parseHtml(result)
			expect(doc.querySelector('span')?.textContent).toBe('Returned')
			expect(doc.querySelector('p')).toBeNull()
		})

		it('handles HTML with multiple top-level elements', () => {
			const result = withDOM(
				'<h1>Title</h1><p>Para</p><ul><li>Item</li></ul>',
				() => {},
			)

			const doc = parseHtml(result)
			expect(doc.querySelector('h1')).toBeTruthy()
			expect(doc.querySelector('p')).toBeTruthy()
			expect(doc.querySelector('ul li')).toBeTruthy()
		})
	})
})
