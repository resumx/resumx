import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { filterByLang } from './index.js'
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
 * Create a pipeline context with optional activeLang
 */
function createContext(activeLang?: string): PipelineContext {
	return {
		config: { activeLang },
		env: { css: '' },
	}
}

// =============================================================================
// Tests: filterByLang
// =============================================================================

describe('filterByLang', () => {
	describe('when no activeLang is specified', () => {
		it('returns unchanged when activeLang is undefined', () => {
			const html = '<span lang="en">Hello</span><p>Common</p>'
			const result = filterByLang(html, createContext())

			expect(result).toBe(html)
		})

		it('returns unchanged when activeLang is empty string', () => {
			const html = '<span lang="en">Hello</span><p>Common</p>'
			const result = filterByLang(html, createContext(''))

			// Empty string is falsy, so it should return unchanged
			expect(result).toBe(html)
		})
	})

	describe('filtering behavior', () => {
		it('keeps elements matching active lang', () => {
			const html = '<span lang="en">Hello</span><span lang="fr">Bonjour</span>'
			const result = filterByLang(html, createContext('en'))
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(1)
			const span = doc.body.children[0] as Element
			expect(span.getAttribute('lang')).toBe('en')
			expect(span.textContent).toBe('Hello')
		})

		it('keeps elements without lang attribute (common content)', () => {
			const html = '<span lang="en">Hello</span><p>Common</p>'
			const result = filterByLang(html, createContext('en'))
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(2)
			const span = doc.body.children[0] as Element
			const p = doc.body.children[1] as Element
			expect(span.getAttribute('lang')).toBe('en')
			expect(p.textContent).toBe('Common')
		})

		it('removes all non-matching lang elements', () => {
			const html = `
				<span lang="en">English</span>
				<span lang="fr">French</span>
				<span lang="de">German</span>
				<p>Common</p>
			`
			const result = filterByLang(html, createContext('en'))
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="en"]')).toBeTruthy()
			expect(doc.querySelector('[lang="fr"]')).toBeNull()
			expect(doc.querySelector('[lang="de"]')).toBeNull()
			expect(doc.querySelector('p')?.textContent).toBe('Common')
		})

		it('handles inline spans within headings', () => {
			const html =
				'<h2><span lang="en">Experience</span> <span lang="fr">Expérience</span></h2>'
			const result = filterByLang(html, createContext('fr'))
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="en"]')).toBeNull()
			expect(doc.querySelector('[lang="fr"]')).toBeTruthy()
			expect(doc.querySelector('h2')?.textContent?.trim()).toContain(
				'Expérience',
			)
		})

		it('handles lang combined with role classes', () => {
			const html = `
				<li lang="en" class="@backend">Built APIs</li>
				<li lang="fr" class="@backend">Développé des APIs</li>
				<li class="@frontend">React, TypeScript</li>
			`
			const result = filterByLang(html, createContext('en'))
			const doc = parseHtml(result)

			const items = doc.querySelectorAll('li')
			expect(items.length).toBe(2)
			expect(items[0]?.textContent).toBe('Built APIs')
			// Common content (no lang) is preserved
			expect(items[1]?.textContent).toBe('React, TypeScript')
		})

		it('handles BCP 47 subtags', () => {
			const html =
				'<span lang="zh-CN">简体</span><span lang="zh-TW">繁體</span>'
			const result = filterByLang(html, createContext('zh-TW'))
			const doc = parseHtml(result)

			expect(doc.querySelector('[lang="zh-TW"]')).toBeTruthy()
			expect(doc.querySelector('[lang="zh-CN"]')).toBeNull()
		})
	})
})
