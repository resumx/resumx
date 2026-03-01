import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { runPipeline } from './index.js'
import type { PipelineContext } from './types.js'

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
 * Create a minimal pipeline context for testing
 */
function createContext(activeTag?: string): PipelineContext {
	return {
		config: {
			activeTag,
		},
	}
}

// =============================================================================
// Tests: runPipeline (Integration)
//
// This file tests the pipeline as a whole, verifying that all processors
// work together correctly. Individual processor tests are in their own files:
// - filter-by-tag.test.ts
// - extract-header.test.ts
// - filter-by-layout.test.ts
// - wrap-sections.test.ts
// =============================================================================

describe('runPipeline', () => {
	describe('standard layout pipeline', () => {
		it('applies all processors in correct order', () => {
			const html = '<h1>Name</h1><h2>Education</h2><p>School</p>'
			const result = runPipeline(html, createContext())
			const doc = parseHtml(result)

			expect(doc.body.children.length).toBe(2)

			const header = doc.body.children[0] as Element
			expect(header.tagName).toBe('HEADER')
			expect(header.children[0].tagName).toBe('H1')
			expect(header.children[0].textContent).toBe('Name')

			const section = doc.body.children[1] as Element
			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBe('education')
			expect(section.children[0].tagName).toBe('H2')
			expect(section.children[0].textContent).toBe('Education')
			expect(section.children[1].tagName).toBe('P')
			expect(section.children[1].textContent).toBe('School')
		})

		it('wraps multiple sections correctly', () => {
			const html = '<h2>Experience</h2><p>Job</p><h2>Skills</h2><p>Skill</p>'
			const result = runPipeline(html, createContext())
			const doc = parseHtml(result)

			const sections = doc.querySelectorAll('section')
			expect(sections.length).toBe(2)
		})
	})

	describe('target filtering in pipeline', () => {
		it('filters by target before other processing', () => {
			const html =
				'<h1>Name</h1><p class="@frontend">Frontend</p><p class="@backend">Backend</p><h2>Skills</h2>'
			const result = runPipeline(html, createContext('frontend'))
			const doc = parseHtml(result)

			const header = doc.querySelector('header')
			expect(header).toBeTruthy()
			expect(header?.children.length).toBe(2)
			expect(header?.children[0].tagName).toBe('H1')
			expect(header?.children[1].tagName).toBe('P')
			expect(header?.children[1].getAttribute('class')).toBe('@frontend')
			expect(header?.children[1].textContent).toBe('Frontend')

			expect(doc.querySelector('.\\@backend')).toBeNull()
		})

		it('preserves all content when no active target specified', () => {
			const html =
				'<h1>Name</h1><p class="@frontend">Frontend</p><p class="@backend">Backend</p><h2>Skills</h2>'
			const result = runPipeline(html, createContext())
			const doc = parseHtml(result)

			const header = doc.querySelector('header')
			expect(header?.children.length).toBe(3)
		})
	})

	describe('complex scenarios', () => {
		it('handles full resume structure', () => {
			const html = `
				<h1>John Doe</h1>
				<blockquote>john@example.com | 555-1234</blockquote>
				<h2>Experience</h2>
				<h3>Company A</h3>
				<p>Job description</p>
				<h2>Skills</h2>
				<ul><li>JavaScript</li><li>TypeScript</li></ul>
			`
			const result = runPipeline(html, createContext())
			const doc = parseHtml(result)

			const header = doc.querySelector('header')
			expect(header?.querySelector('h1')?.textContent).toBe('John Doe')
			expect(header?.querySelector('blockquote')).toBeTruthy()

			const expSection = doc.querySelector('section#experience')
			expect(expSection).toBeTruthy()
			expect(expSection?.querySelector('h3')?.textContent).toBe('Company A')

			const skillsSection = doc.querySelector('section#skills')
			expect(skillsSection).toBeTruthy()
			expect(skillsSection?.querySelectorAll('li').length).toBe(2)
		})

		it('handles multiple sections', () => {
			const html = `
				<h1>Name</h1>
				<h2>Experience</h2><p>Job</p>
				<h2>Projects</h2><p>Project</p>
				<h2>Skills</h2><p>Skill</p>
				<h2>Education</h2><p>School</p>
			`
			const result = runPipeline(html, createContext())
			const doc = parseHtml(result)

			const sections = doc.querySelectorAll('section')
			expect(sections.length).toBe(4)
			expect(doc.querySelector('section#experience')).toBeTruthy()
			expect(doc.querySelector('section#projects')).toBeTruthy()
			expect(doc.querySelector('section#skills')).toBeTruthy()
			expect(doc.querySelector('section#education')).toBeTruthy()
		})
	})
})
