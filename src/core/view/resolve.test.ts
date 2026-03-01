import { describe, it, expect } from 'vitest'
import { resolveView } from './resolve.js'
import type { ViewLayer } from './types.js'

describe('resolveView', () => {
	describe('defaults', () => {
		it('returns built-in defaults when given no layers', () => {
			const result = resolveView([])

			expect(result).toEqual({
				selects: null,
				sections: { hide: [], pin: [] },
				pages: null,
				bulletOrder: 'none',
				vars: {},
				style: {},
				format: 'pdf',
				output: null,
				css: null,
				lang: null,
			})
		})

		it('returns built-in defaults when given a layer with no overrides', () => {
			const result = resolveView([{}])

			expect(result).toEqual({
				selects: null,
				sections: { hide: [], pin: [] },
				pages: null,
				bulletOrder: 'none',
				vars: {},
				style: {},
				format: 'pdf',
				output: null,
				css: null,
				lang: null,
			})
		})
	})

	describe('scalar replacement (later layer wins)', () => {
		it('replaces pages from later layer', () => {
			const result = resolveView([{ pages: 2 }, { pages: 1 }])

			expect(result.pages).toBe(1)
		})

		it('replaces bulletOrder from later layer', () => {
			const result = resolveView([
				{ bulletOrder: 'none' },
				{ bulletOrder: 'tag' },
			])

			expect(result.bulletOrder).toBe('tag')
		})

		it('replaces format from later layer', () => {
			const result = resolveView([{ format: 'pdf' }, { format: 'html' }])

			expect(result.format).toBe('html')
		})

		it('replaces output from later layer', () => {
			const result = resolveView([{ output: 'first' }, { output: 'second' }])

			expect(result.output).toBe('second')
		})

		it('undefined scalar in later layer does not override earlier value', () => {
			const result = resolveView([{ pages: 2 }, {}])

			expect(result.pages).toBe(2)
		})
	})

	describe('record shallow merge', () => {
		it('merges vars from multiple layers', () => {
			const result = resolveView([
				{ vars: { name: 'Alice', role: 'Engineer' } },
				{ vars: { role: 'Manager', team: 'Platform' } },
			])

			expect(result.vars).toEqual({
				name: 'Alice',
				role: 'Manager',
				team: 'Platform',
			})
		})

		it('merges style from multiple layers', () => {
			const result = resolveView([
				{ style: { 'font-family': 'Arial', 'font-size': '14px' } },
				{ style: { 'font-family': 'Helvetica', color: '#333' } },
			])

			expect(result.style).toEqual({
				'font-family': 'Helvetica',
				'font-size': '14px',
				color: '#333',
			})
		})

		it('undefined record in later layer does not override earlier value', () => {
			const result = resolveView([{ vars: { name: 'Alice' } }, {}])

			expect(result.vars).toEqual({ name: 'Alice' })
		})
	})

	describe('array replacement (later layer replaces, no concat)', () => {
		it('replaces selects from later layer', () => {
			const result = resolveView([
				{ selects: ['frontend', 'backend'] },
				{ selects: ['devops'] },
			])

			expect(result.selects).toEqual(['devops'])
		})

		it('replaces css from later layer', () => {
			const result = resolveView([
				{ css: ['base.css', 'theme.css'] },
				{ css: ['custom.css'] },
			])

			expect(result.css).toEqual(['custom.css'])
		})

		it('undefined array in later layer does not override earlier value', () => {
			const result = resolveView([{ selects: ['frontend'] }, {}])

			expect(result.selects).toEqual(['frontend'])
		})
	})

	describe('sections namespace merge', () => {
		it('replaces hide from later layer', () => {
			const result = resolveView([
				{ sections: { hide: ['publications', 'volunteer'] } },
				{ sections: { hide: [] } },
			])

			expect(result.sections.hide).toEqual([])
		})

		it('replaces pin from later layer', () => {
			const result = resolveView([
				{ sections: { pin: ['skills', 'work'] } },
				{ sections: { pin: ['education'] } },
			])

			expect(result.sections.pin).toEqual(['education'])
		})

		it('setting only hide preserves existing pin', () => {
			const result = resolveView([
				{ sections: { pin: ['skills', 'work'] } },
				{ sections: { hide: ['publications'] } },
			])

			expect(result.sections.hide).toEqual(['publications'])
			expect(result.sections.pin).toEqual(['skills', 'work'])
		})

		it('setting only pin preserves existing hide', () => {
			const result = resolveView([
				{ sections: { hide: ['publications'] } },
				{ sections: { pin: ['skills'] } },
			])

			expect(result.sections.hide).toEqual(['publications'])
			expect(result.sections.pin).toEqual(['skills'])
		})

		it('child view can un-hide by replacing with empty array', () => {
			const result = resolveView([
				{ sections: { hide: ['publications'] } },
				{ sections: { hide: [] } },
			])

			expect(result.sections.hide).toEqual([])
		})

		it('hide and pin from same layer both resolve', () => {
			const result = resolveView([
				{ sections: { hide: ['publications'], pin: ['skills', 'work'] } },
			])

			expect(result.sections.hide).toEqual(['publications'])
			expect(result.sections.pin).toEqual(['skills', 'work'])
		})

		it('undefined sections in later layer does not override earlier value', () => {
			const result = resolveView([{ sections: { hide: ['publications'] } }, {}])

			expect(result.sections.hide).toEqual(['publications'])
		})
	})

	describe('3-layer merge order', () => {
		it('merges three layers in order (default, tag view, ephemeral)', () => {
			const defaultView: ViewLayer = {
				pages: 2,
				vars: { name: 'Alice', tagline: 'Default tagline' },
				style: { 'font-family': 'Arial' },
				selects: ['frontend', 'backend'],
			}
			const tagView: ViewLayer = {
				selects: ['frontend'],
				vars: { tagline: 'Frontend expert' },
			}
			const ephemeral: ViewLayer = {
				pages: 1,
				vars: { tagline: 'CLI override' },
			}

			const result = resolveView([defaultView, tagView, ephemeral])

			expect(result.pages).toBe(1)
			expect(result.selects).toEqual(['frontend'])
			expect(result.vars).toEqual({
				name: 'Alice',
				tagline: 'CLI override',
			})
			expect(result.style).toEqual({ 'font-family': 'Arial' })
			expect(result.format).toBe('pdf')
			expect(result.bulletOrder).toBe('none')
		})
	})

	describe('format field override', () => {
		it('view layer format overrides default pdf', () => {
			const result = resolveView([{ format: 'html' }])

			expect(result.format).toBe('html')
		})

		it('later layer format overrides earlier', () => {
			const result = resolveView([{ format: 'html' }, { format: 'docx' }])

			expect(result.format).toBe('docx')
		})

		it('defaults to pdf when no layer sets format', () => {
			const result = resolveView([{ pages: 1 }, { vars: { a: 'b' } }])

			expect(result.format).toBe('pdf')
		})
	})
})
