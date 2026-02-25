import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { wrapSections, slugify } from './index.js'
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
 * Create a minimal pipeline context for testing
 */
function createContext(): PipelineContext {
	return {
		config: {},
		env: { css: '' },
	}
}

// =============================================================================
// Tests: slugify
// =============================================================================

describe('slugify', () => {
	describe('basic transformations', () => {
		it('converts spaces to hyphens', () => {
			expect(slugify('Work Experience')).toBe('work-experience')
		})

		it('converts to lowercase', () => {
			expect(slugify('EDUCATION')).toBe('education')
		})

		it('trims whitespace', () => {
			expect(slugify('  Projects  ')).toBe('projects')
		})
	})

	describe('special character handling', () => {
		it('converts & to and', () => {
			expect(slugify('Skills & Tools')).toBe('skills-and-tools')
		})

		it('removes parentheses', () => {
			expect(slugify('Education (Degrees)')).toBe('education-degrees')
		})

		it('removes apostrophes', () => {
			expect(slugify("Developer's Guide")).toBe('developers-guide')
		})

		it('removes colons', () => {
			expect(slugify('Section: Overview')).toBe('section-overview')
		})

		it('handles emoji', () => {
			expect(slugify('Skills 🚀')).toBe('skills')
		})
	})

	describe('hyphen normalization', () => {
		it('handles multiple spaces', () => {
			expect(slugify('Technical   Skills')).toBe('technical-skills')
		})

		it('removes consecutive hyphens', () => {
			expect(slugify('Work - Experience')).toBe('work-experience')
		})

		it('removes leading hyphens', () => {
			expect(slugify('- Projects')).toBe('projects')
		})

		it('removes trailing hyphens', () => {
			expect(slugify('Projects -')).toBe('projects')
		})

		it('handles multiple special chars creating hyphens', () => {
			expect(slugify('A & B & C')).toBe('a-and-b-and-c')
		})
	})

	describe('edge cases', () => {
		it('handles empty string', () => {
			expect(slugify('')).toBe('')
		})

		it('handles only whitespace', () => {
			expect(slugify('   ')).toBe('')
		})

		it('handles only special characters', () => {
			expect(slugify('!@#$%')).toBe('')
		})

		it('handles unicode characters', () => {
			expect(slugify('日本語')).toBe('')
		})

		it('handles mixed unicode and ASCII', () => {
			expect(slugify('Skills 日本語 Python')).toBe('skills-python')
		})

		it('handles numbers', () => {
			expect(slugify('Phase 2 Plan')).toBe('phase-2-plan')
		})

		it('handles hyphenated words', () => {
			expect(slugify('full-stack developer')).toBe('full-stack-developer')
		})
	})
})

// =============================================================================
// Tests: wrapSections
// =============================================================================

describe('wrapSections', () => {
	describe('basic section wrapping', () => {
		it('wraps h2 and following content in section element', () => {
			const html = '<h2>Education</h2><p>Content here</p>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Verify root has exactly one child: the section
			expect(doc.body.children.length).toBe(1)
			const section = doc.body.children[0] as Element
			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBe('education')

			// Verify section has exactly 2 children: h2, p
			expect(section.children.length).toBe(2)
			expect(section.children[0].tagName).toBe('H2')
			expect(section.children[0].textContent).toBe('Education')
			expect(section.children[1].tagName).toBe('P')
			expect(section.children[1].textContent).toBe('Content here')
		})

		it('sets section id from slugified h2 text', () => {
			const html = '<h2>Work Experience</h2><p>Job details</p>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			const section = doc.body.children[0] as Element
			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBe('work-experience')
			expect(section.children.length).toBe(2)
			expect(section.children[0].textContent).toBe('Work Experience')
			expect(section.children[1].textContent).toBe('Job details')
		})

		it('h2 becomes child of section', () => {
			const html = '<h2>Education</h2><p>Content</p>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			const section = doc.body.children[0] as Element
			const h2 = section.children[0]

			expect(h2.tagName).toBe('H2')
			expect(h2.parentElement).toBe(section)
		})
	})

	describe('multiple sections', () => {
		it('creates multiple sections for multiple h2s', () => {
			const html =
				'<h2>Education</h2><p>School</p><h2>Experience</h2><p>Job</p>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Verify root has exactly 2 sections
			expect(doc.body.children.length).toBe(2)
			expect(doc.body.children[0].tagName).toBe('SECTION')
			expect(doc.body.children[1].tagName).toBe('SECTION')

			// Verify first section structure
			const section1 = doc.body.children[0] as Element
			expect(section1.children.length).toBe(2)
			expect(section1.children[0].tagName).toBe('H2')
			expect(section1.children[0].textContent).toBe('Education')
			expect(section1.children[1].tagName).toBe('P')
			expect(section1.children[1].textContent).toBe('School')

			// Verify second section structure
			const section2 = doc.body.children[1] as Element
			expect(section2.children.length).toBe(2)
			expect(section2.children[0].tagName).toBe('H2')
			expect(section2.children[0].textContent).toBe('Experience')
			expect(section2.children[1].tagName).toBe('P')
			expect(section2.children[1].textContent).toBe('Job')
		})

		it('assigns unique ids to each section', () => {
			const html =
				'<h2>Education</h2><p>School</p><h2>Experience</h2><p>Job</p>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			const section1 = doc.body.children[0] as Element
			const section2 = doc.body.children[1] as Element

			expect(section1.getAttribute('id')).toBe('education')
			expect(section2.getAttribute('id')).toBe('experience')
		})

		it('maintains section order matching h2 order', () => {
			const html =
				'<h2>First</h2><p>A</p><h2>Second</h2><p>B</p><h2>Third</h2><p>C</p>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Verify exact order and structure
			expect(doc.body.children.length).toBe(3)

			const sections = Array.from(doc.body.children) as Element[]
			expect(sections[0].getAttribute('id')).toBe('first')
			expect(sections[0].children[0].textContent).toBe('First')
			expect(sections[0].children[1].textContent).toBe('A')

			expect(sections[1].getAttribute('id')).toBe('second')
			expect(sections[1].children[0].textContent).toBe('Second')
			expect(sections[1].children[1].textContent).toBe('B')

			expect(sections[2].getAttribute('id')).toBe('third')
			expect(sections[2].children[0].textContent).toBe('Third')
			expect(sections[2].children[1].textContent).toBe('C')
		})
	})

	describe('section boundary detection', () => {
		it('stops section at next h2', () => {
			const html =
				'<h2>Education</h2><p>School</p><h2>Experience</h2><p>Job</p>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Verify complete DOM structure: exactly 2 sections, each isolated
			expect(doc.body.children.length).toBe(2)

			const section1 = doc.body.children[0] as Element
			const section2 = doc.body.children[1] as Element

			// Education section has exactly h2 + p
			expect(section1.getAttribute('id')).toBe('education')
			expect(section1.children.length).toBe(2)
			expect(section1.children[0].tagName).toBe('H2')
			expect(section1.children[0].textContent).toBe('Education')
			expect(section1.children[1].tagName).toBe('P')
			expect(section1.children[1].textContent).toBe('School')

			// Experience section has exactly h2 + p (not Education's content)
			expect(section2.getAttribute('id')).toBe('experience')
			expect(section2.children.length).toBe(2)
			expect(section2.children[0].tagName).toBe('H2')
			expect(section2.children[0].textContent).toBe('Experience')
			expect(section2.children[1].tagName).toBe('P')
			expect(section2.children[1].textContent).toBe('Job')
		})

		it('stops section at hr element', () => {
			const html = '<h2>Education</h2><p>School</p><hr><h2>Skills</h2>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Verify structure: section, hr, section (3 root children)
			expect(doc.body.children.length).toBe(3)

			const section1 = doc.body.children[0] as Element
			const hr = doc.body.children[1] as Element
			const section2 = doc.body.children[2] as Element

			// First section: exactly h2 + p (hr is outside)
			expect(section1.tagName).toBe('SECTION')
			expect(section1.getAttribute('id')).toBe('education')
			expect(section1.children.length).toBe(2)
			expect(section1.children[0].tagName).toBe('H2')
			expect(section1.children[1].tagName).toBe('P')

			// HR at root level
			expect(hr.tagName).toBe('HR')

			// Second section
			expect(section2.tagName).toBe('SECTION')
			expect(section2.getAttribute('id')).toBe('skills')
		})

		it('hr remains at root level between sections', () => {
			const html = '<h2>Education</h2><p>School</p><hr><h2>Skills</h2>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Verify hr is direct child of body at position 1
			const rootChildren = Array.from(doc.body.children)
			expect(rootChildren.length).toBe(3)
			expect(rootChildren[1].tagName).toBe('HR')
			expect(rootChildren[1].parentElement).toBe(doc.body)
		})
	})

	describe('header element handling', () => {
		it('does not wrap h2 inside header element', () => {
			const html = '<header><h2>Contact</h2></header><h2>Education</h2>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Root structure: header, section (2 children)
			expect(doc.body.children.length).toBe(2)

			// Header unchanged - contains only h2, no section
			const header = doc.body.children[0] as Element
			expect(header.tagName).toBe('HEADER')
			expect(header.children.length).toBe(1)
			expect(header.children[0].tagName).toBe('H2')
			expect(header.children[0].textContent).toBe('Contact')

			// Section wraps the outside h2
			const section = doc.body.children[1] as Element
			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBe('education')
			expect(section.children.length).toBe(1)
			expect(section.children[0].tagName).toBe('H2')
			expect(section.children[0].textContent).toBe('Education')
		})

		it('only wraps direct child h2s, not nested ones', () => {
			const html = '<header><h2>In Header</h2></header><h2>Outside</h2>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Verify exactly 2 root children: header, section
			expect(doc.body.children.length).toBe(2)
			expect(doc.body.children[0].tagName).toBe('HEADER')
			expect(doc.body.children[1].tagName).toBe('SECTION')

			// Verify header's h2 is untouched
			const header = doc.body.children[0] as Element
			expect(header.children[0].tagName).toBe('H2')
			expect(header.children[0].textContent).toBe('In Header')

			// Verify section has correct id and content
			const section = doc.body.children[1] as Element
			expect(section.getAttribute('id')).toBe('outside')
			expect(section.children[0].textContent).toBe('Outside')
		})
	})

	describe('element attribute preservation', () => {
		it('preserves classes on h2 elements', () => {
			const html =
				'<h2 class="text-blue-500 font-bold">Education</h2><p>Content</p>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			const section = doc.body.children[0] as Element
			const h2 = section.children[0] as Element

			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBe('education')
			expect(h2.tagName).toBe('H2')
			expect(h2.getAttribute('class')).toBe('text-blue-500 font-bold')
			expect(h2.textContent).toBe('Education')
		})

		it('preserves id on h2 elements', () => {
			const html = '<h2 id="custom-id">Education</h2><p>Content</p>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			const section = doc.body.children[0] as Element
			const h2 = section.children[0] as Element

			// Section gets slugified id, h2 keeps custom id
			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBe('education')
			expect(h2.tagName).toBe('H2')
			expect(h2.getAttribute('id')).toBe('custom-id')
		})

		it('preserves attributes on content elements', () => {
			const html =
				'<h2>Skills</h2><ul class="skill-list"><li data-level="5">Python</li></ul>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Verify complete section structure
			const section = doc.body.children[0] as Element
			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBe('skills')
			expect(section.children.length).toBe(2)

			// Verify ul with class
			const ul = section.children[1] as Element
			expect(ul.tagName).toBe('UL')
			expect(ul.getAttribute('class')).toBe('skill-list')
			expect(ul.children.length).toBe(1)

			// Verify li with data attribute
			const li = ul.children[0] as Element
			expect(li.tagName).toBe('LI')
			expect(li.getAttribute('data-level')).toBe('5')
			expect(li.textContent).toBe('Python')
		})
	})

	describe('edge cases', () => {
		it('handles empty content after h2', () => {
			const html = '<h2>Empty Section</h2>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Root has exactly one section
			expect(doc.body.children.length).toBe(1)

			const section = doc.body.children[0] as Element
			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBe('empty-section')

			// Section has exactly one child: the h2
			expect(section.children.length).toBe(1)
			expect(section.children[0].tagName).toBe('H2')
			expect(section.children[0].textContent).toBe('Empty Section')
		})

		it('handles h2 with no id-able text', () => {
			const html = '<h2>   </h2><p>Content</p>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Root has exactly one section
			expect(doc.body.children.length).toBe(1)

			const section = doc.body.children[0] as Element
			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBeNull() // Empty slug = no id

			// Section structure: h2 + p
			expect(section.children.length).toBe(2)
			expect(section.children[0].tagName).toBe('H2')
			expect(section.children[1].tagName).toBe('P')
			expect(section.children[1].textContent).toBe('Content')
		})

		it('returns unchanged when no h2 exists', () => {
			const html = '<p>Just paragraphs</p><div>And divs</div>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// No sections created
			expect(doc.querySelectorAll('section').length).toBe(0)

			// Original structure preserved
			expect(doc.body.children.length).toBe(2)
			expect(doc.body.children[0].tagName).toBe('P')
			expect(doc.body.children[0].textContent).toBe('Just paragraphs')
			expect(doc.body.children[1].tagName).toBe('DIV')
			expect(doc.body.children[1].textContent).toBe('And divs')
		})

		it('handles deeply nested content within sections', () => {
			const html = `<h2>Skills</h2>
				<div class="skills-container">
					<ul>
						<li><strong>Python</strong> - Advanced</li>
						<li><span class="highlight">JavaScript</span></li>
					</ul>
				</div>`
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Root has one section
			expect(doc.body.children.length).toBe(1)

			const section = doc.body.children[0] as Element
			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBe('skills')

			// Section has h2 + div (ignoring whitespace text nodes)
			const sectionChildren = Array.from(section.children)
			expect(sectionChildren.length).toBe(2)
			expect(sectionChildren[0].tagName).toBe('H2')
			expect(sectionChildren[0].textContent).toBe('Skills')

			// Verify nested structure
			const container = sectionChildren[1] as Element
			expect(container.tagName).toBe('DIV')
			expect(container.getAttribute('class')).toBe('skills-container')

			const ul = container.children[0] as Element
			expect(ul.tagName).toBe('UL')
			expect(ul.children.length).toBe(2)

			// First li: <strong>Python</strong> - Advanced
			const li1 = ul.children[0] as Element
			expect(li1.tagName).toBe('LI')
			expect(li1.children[0].tagName).toBe('STRONG')
			expect(li1.children[0].textContent).toBe('Python')

			// Second li: <span class="highlight">JavaScript</span>
			const li2 = ul.children[1] as Element
			expect(li2.tagName).toBe('LI')
			const span = li2.children[0] as Element
			expect(span.tagName).toBe('SPAN')
			expect(span.getAttribute('class')).toBe('highlight')
			expect(span.textContent).toBe('JavaScript')
		})

		it('handles content with role classes', () => {
			const html =
				'<h2>Experience</h2><p class="@frontend">Frontend work</p><p class="@backend">Backend work</p>'
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Root has one section
			expect(doc.body.children.length).toBe(1)

			const section = doc.body.children[0] as Element
			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBe('experience')

			// Section has h2 + 2 paragraphs
			expect(section.children.length).toBe(3)
			expect(section.children[0].tagName).toBe('H2')
			expect(section.children[0].textContent).toBe('Experience')

			const p1 = section.children[1] as Element
			expect(p1.tagName).toBe('P')
			expect(p1.getAttribute('class')).toBe('@frontend')
			expect(p1.textContent).toBe('Frontend work')

			const p2 = section.children[2] as Element
			expect(p2.tagName).toBe('P')
			expect(p2.getAttribute('class')).toBe('@backend')
			expect(p2.textContent).toBe('Backend work')
		})
	})

	describe('special section titles', () => {
		it.each([
			['Technical Skills & Tools', 'technical-skills-and-tools'],
			["What I've Built", 'what-ive-built'],
			['2023 Projects', '2023-projects'],
			['Full-Stack Experience', 'full-stack-experience'],
			['Work @ Company', 'work-company'],
		])('correctly slugifies "%s" to "%s"', (title, expectedId) => {
			const html = `<h2>${title}</h2><p>Content</p>`
			const result = wrapSections(html, createContext())
			const doc = parseHtml(result)

			// Verify complete DOM structure
			expect(doc.body.children.length).toBe(1)

			const section = doc.body.children[0] as Element
			expect(section.tagName).toBe('SECTION')
			expect(section.getAttribute('id')).toBe(expectedId)

			// Verify section content
			expect(section.children.length).toBe(2)
			expect(section.children[0].tagName).toBe('H2')
			expect(section.children[0].textContent).toBe(title)
			expect(section.children[1].tagName).toBe('P')
			expect(section.children[1].textContent).toBe('Content')
		})
	})
})
