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
function createContext(css: string = '', activeRole?: string): PipelineContext {
	return {
		config: {
			activeRole,
		},
		env: {
			css,
		},
	}
}

// =============================================================================
// Test Fixtures
// =============================================================================

const CSS_WITH_TWO_COLUMN = `
.two-column-layout {
	display: grid;
	grid-template-columns: 2fr 1fr;
}
`

const CSS_WITHOUT_TWO_COLUMN = `
body {
	font-family: Arial;
}
`

// =============================================================================
// Tests: runPipeline (Integration)
//
// This file tests the pipeline as a whole, verifying that all processors
// work together correctly. Individual processor tests are in their own files:
// - filter-by-role.test.ts
// - extract-header.test.ts
// - process-columns.test.ts
// - wrap-sections.test.ts
// =============================================================================

describe('runPipeline', () => {
	describe('two-column layout pipeline', () => {
		it('applies all processors in correct order', () => {
			const html =
				'<h1>Name</h1><h2>Education</h2><p>School</p><hr><h2>Skills</h2><p>Skill</p>'
			const result = runPipeline(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			// Verify complete DOM structure
			expect(doc.body.children.length).toBe(1)

			const layout = doc.body.children[0] as Element
			expect(layout.getAttribute('class')).toBe('two-column-layout')

			// Layout has: header, primary, secondary
			expect(layout.children.length).toBe(3)

			// Header extracted
			const header = layout.children[0] as Element
			expect(header.tagName).toBe('HEADER')
			expect(header.children[0].tagName).toBe('H1')
			expect(header.children[0].textContent).toBe('Name')

			// Primary column with section
			const primary = layout.children[1] as Element
			expect(primary.getAttribute('class')).toBe('primary')
			expect(primary.children.length).toBe(1)

			const eduSection = primary.children[0] as Element
			expect(eduSection.tagName).toBe('SECTION')
			expect(eduSection.getAttribute('id')).toBe('education')
			expect(eduSection.children[0].tagName).toBe('H2')
			expect(eduSection.children[0].textContent).toBe('Education')
			expect(eduSection.children[1].tagName).toBe('P')
			expect(eduSection.children[1].textContent).toBe('School')

			// Secondary column with section
			const secondary = layout.children[2] as Element
			expect(secondary.getAttribute('class')).toBe('secondary')
			expect(secondary.children.length).toBe(1)

			const skillsSection = secondary.children[0] as Element
			expect(skillsSection.tagName).toBe('SECTION')
			expect(skillsSection.getAttribute('id')).toBe('skills')
			expect(skillsSection.children[0].tagName).toBe('H2')
			expect(skillsSection.children[0].textContent).toBe('Skills')
			expect(skillsSection.children[1].tagName).toBe('P')
			expect(skillsSection.children[1].textContent).toBe('Skill')
		})

		it('removes hr elements in two-column mode', () => {
			const html = '<h2>Exp</h2><hr><h2>Skills</h2>'
			const result = runPipeline(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			expect(doc.querySelector('hr')).toBeNull()
		})
	})

	describe('single-column layout pipeline', () => {
		it('applies processors without two-column layout', () => {
			const html = '<h1>Name</h1><h2>Education</h2><p>School</p>'
			const result = runPipeline(html, createContext(CSS_WITHOUT_TWO_COLUMN))
			const doc = parseHtml(result)

			// No two-column layout
			expect(doc.querySelector('.two-column-layout')).toBeNull()

			// Structure: header, section
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

		it('removes hr elements without creating columns', () => {
			const html = '<h2>Exp</h2><hr><h2>Skills</h2>'
			const result = runPipeline(html, createContext(CSS_WITHOUT_TWO_COLUMN))
			const doc = parseHtml(result)

			expect(doc.querySelector('hr')).toBeNull()
			expect(doc.querySelector('.two-column-layout')).toBeNull()

			// Both h2s are wrapped in sections
			const sections = doc.querySelectorAll('section')
			expect(sections.length).toBe(2)
		})
	})

	describe('role filtering in pipeline', () => {
		it('filters by role before other processing', () => {
			const html =
				'<h1>Name</h1><p class="@frontend">Frontend</p><p class="@backend">Backend</p><h2>Skills</h2>'
			const result = runPipeline(
				html,
				createContext(CSS_WITHOUT_TWO_COLUMN, 'frontend'),
			)
			const doc = parseHtml(result)

			// Header should contain only name and frontend paragraph
			const header = doc.querySelector('header')
			expect(header).toBeTruthy()
			expect(header?.children.length).toBe(2)
			expect(header?.children[0].tagName).toBe('H1')
			expect(header?.children[1].tagName).toBe('P')
			expect(header?.children[1].getAttribute('class')).toBe('@frontend')
			expect(header?.children[1].textContent).toBe('Frontend')

			// Backend paragraph is removed
			expect(doc.querySelector('.\\@backend')).toBeNull()
		})

		it('preserves all content when no activeRole specified', () => {
			const html =
				'<h1>Name</h1><p class="@frontend">Frontend</p><p class="@backend">Backend</p><h2>Skills</h2>'
			const result = runPipeline(html, createContext(CSS_WITHOUT_TWO_COLUMN))
			const doc = parseHtml(result)

			const header = doc.querySelector('header')
			expect(header?.children.length).toBe(3) // h1, p.frontend, p.backend
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
				<hr>
				<h2>Skills</h2>
				<ul><li>JavaScript</li><li>TypeScript</li></ul>
			`
			const result = runPipeline(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			// Two-column layout created
			const layout = doc.querySelector('.two-column-layout')
			expect(layout).toBeTruthy()

			// Header with name and contact
			const header = layout?.querySelector('header')
			expect(header?.querySelector('h1')?.textContent).toBe('John Doe')
			expect(header?.querySelector('blockquote')).toBeTruthy()

			// Experience in primary
			const primary = layout?.querySelector('.primary')
			const expSection = primary?.querySelector('section#experience')
			expect(expSection).toBeTruthy()
			expect(expSection?.querySelector('h3')?.textContent).toBe('Company A')

			// Skills in secondary
			const secondary = layout?.querySelector('.secondary')
			const skillsSection = secondary?.querySelector('section#skills')
			expect(skillsSection).toBeTruthy()
			expect(skillsSection?.querySelectorAll('li').length).toBe(2)
		})

		it('handles multiple sections per column', () => {
			const html = `
				<h1>Name</h1>
				<h2>Experience</h2><p>Job</p>
				<h2>Projects</h2><p>Project</p>
				<hr>
				<h2>Skills</h2><p>Skill</p>
				<h2>Education</h2><p>School</p>
			`
			const result = runPipeline(html, createContext(CSS_WITH_TWO_COLUMN))
			const doc = parseHtml(result)

			const primary = doc.querySelector('.primary')
			const secondary = doc.querySelector('.secondary')

			// Primary has 2 sections
			expect(primary?.querySelectorAll('section').length).toBe(2)
			expect(primary?.querySelector('section#experience')).toBeTruthy()
			expect(primary?.querySelector('section#projects')).toBeTruthy()

			// Secondary has 2 sections
			expect(secondary?.querySelectorAll('section').length).toBe(2)
			expect(secondary?.querySelector('section#skills')).toBeTruthy()
			expect(secondary?.querySelector('section#education')).toBeTruthy()
		})
	})
})
