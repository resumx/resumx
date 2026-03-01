import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import { arrangeSections } from './index.js'
import type { PipelineContext } from '../types.js'
import type { SectionType } from '../../section-types.js'

function parseHtml(html: string) {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!
	return {
		root,
		sections: () =>
			Array.from(root.querySelectorAll('section')).map(
				s => s.getAttribute('data-section')!,
			),
		hasHeader: () => root.querySelector('header') !== null,
		html: () => root.innerHTML,
	}
}

function createContext(
	hide?: SectionType[],
	pin?: SectionType[],
): PipelineContext {
	return {
		config: { sections: { hide, pin } },
		env: { css: '' },
	}
}

const HTML_WITH_SECTIONS = [
	'<header><h1>Jane Doe</h1></header>',
	'<section data-section="work"><h2>Experience</h2><p>...</p></section>',
	'<section data-section="skills"><h2>Skills</h2><p>...</p></section>',
	'<section data-section="education"><h2>Education</h2><p>...</p></section>',
	'<section data-section="projects"><h2>Projects</h2><p>...</p></section>',
].join('')

describe('arrangeSections', () => {
	describe('when both hide and pin are empty/undefined (no-op)', () => {
		it('returns unchanged when sections is undefined', () => {
			const result = arrangeSections(HTML_WITH_SECTIONS, {
				config: {},
				env: { css: '' },
			})
			expect(result).toBe(HTML_WITH_SECTIONS)
		})

		it('returns unchanged when both are empty', () => {
			const result = arrangeSections(HTML_WITH_SECTIONS, createContext([], []))
			expect(result).toBe(HTML_WITH_SECTIONS)
		})
	})

	describe('hide', () => {
		it('removes hidden sections', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(['publications', 'projects']),
			)
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual(['work', 'skills', 'education'])
		})

		it('preserves source order for remaining sections', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(['skills']),
			)
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual(['work', 'education', 'projects'])
		})

		it('header always renders regardless of hide', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(['work', 'skills', 'education', 'projects']),
			)
			const doc = parseHtml(result)

			expect(doc.hasHeader()).toBe(true)
			expect(doc.sections()).toEqual([])
		})

		it('ignores hide entries that match no section in the document', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(['awards', 'publications']),
			)
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'work',
				'skills',
				'education',
				'projects',
			])
		})

		it('empty hide array is a no-op', () => {
			const result = arrangeSections(HTML_WITH_SECTIONS, createContext([]))
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'work',
				'skills',
				'education',
				'projects',
			])
		})
	})

	describe('pin', () => {
		it('moves pinned sections to the top in specified order', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(undefined, ['skills']),
			)
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'skills',
				'work',
				'education',
				'projects',
			])
		})

		it('pins multiple sections in specified order, rest follow in source order', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(undefined, ['skills', 'projects']),
			)
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'skills',
				'projects',
				'work',
				'education',
			])
		})

		it('preserves source order for non-pinned sections', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(undefined, ['education']),
			)
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'education',
				'work',
				'skills',
				'projects',
			])
		})

		it('header always renders regardless of pin', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(undefined, ['skills']),
			)
			const doc = parseHtml(result)

			expect(doc.hasHeader()).toBe(true)
		})

		it('ignores pin entries that match no section in the document', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(undefined, ['awards', 'skills']),
			)
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'skills',
				'work',
				'education',
				'projects',
			])
		})

		it('empty pin array is a no-op', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(undefined, []),
			)
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual([
				'work',
				'skills',
				'education',
				'projects',
			])
		})
	})

	describe('hide + pin composed', () => {
		it('hides sections and pins remaining ones', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(['projects'], ['skills', 'work']),
			)
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual(['skills', 'work', 'education'])
		})

		it('hidden sections do not appear even if document has them', () => {
			const result = arrangeSections(
				HTML_WITH_SECTIONS,
				createContext(['education', 'projects'], ['skills']),
			)
			const doc = parseHtml(result)

			expect(doc.sections()).toEqual(['skills', 'work'])
		})
	})

	describe('edge cases', () => {
		it('handles empty HTML', () => {
			const result = arrangeSections('', createContext(['work']))
			expect(result).toBe('')
		})

		it('handles HTML with no sections', () => {
			const html = '<header><h1>Jane</h1></header><p>No sections</p>'
			const result = arrangeSections(html, createContext(['work']))
			const doc = parseHtml(result)

			expect(doc.hasHeader()).toBe(true)
			expect(doc.sections()).toEqual([])
		})
	})
})
