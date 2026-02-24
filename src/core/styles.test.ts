import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { DEFAULT_STYLESHEET, parseCssVariables } from './styles.js'

describe('styles', () => {
	describe('DEFAULT_STYLESHEET', () => {
		it('points to an existing file', () => {
			expect(existsSync(DEFAULT_STYLESHEET)).toBe(true)
		})
	})

	describe('parseCssVariables', () => {
		it('parses CSS variables from :root block', () => {
			const css = `
:root {
	--font-family: 'Georgia', serif;
	--base-font-size: 10pt;
	--text-color: #222;
}
body { color: var(--text-color); }
`
			const vars = parseCssVariables(css)
			expect(vars).toEqual([
				{ name: '--font-family', value: "'Georgia', serif" },
				{ name: '--base-font-size', value: '10pt' },
				{ name: '--text-color', value: '#222' },
			])
		})

		it('returns empty array when no :root block', () => {
			const css = `body { color: red; }`
			const vars = parseCssVariables(css)
			expect(vars).toEqual([])
		})

		it('returns empty array when :root has no variables', () => {
			const css = `:root { font-size: 16px; }`
			const vars = parseCssVariables(css)
			expect(vars).toEqual([])
		})

		it('handles multiline variable values', () => {
			const css = `
:root {
	--font-family:
		'Palatino Linotype', 'Palatino', 'Georgia', serif;
	--base-font-size: 10pt;
}
`
			const vars = parseCssVariables(css)
			expect(vars).toEqual([
				{
					name: '--font-family',
					value: "'Palatino Linotype', 'Palatino', 'Georgia', serif",
				},
				{ name: '--base-font-size', value: '10pt' },
			])
		})
	})
})
