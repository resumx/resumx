import { describe, it, expect } from 'vitest'
import { unknownFencedDivTagPlugin } from './unknown-fenced-div-tag.js'
import { createMarkdownRenderer } from '../../markdown.js'
import type { ValidationContext } from '../types.js'

function createContext(content: string): ValidationContext {
	const md = createMarkdownRenderer()
	const tokens = md.parse(content, {})
	const lines = content.split('\n')
	return { content, tokens, lines }
}

async function validate(content: string) {
	const ctx = createContext(content)
	return await unknownFencedDivTagPlugin.validate(ctx)
}

describe('unknownFencedDivTagPlugin', () => {
	it('should have correct name', () => {
		expect(unknownFencedDivTagPlugin.name).toBe('unknown-fenced-div-tag')
	})

	describe('known tags produce no issues', () => {
		it.each(['div', 'nav', 'article', 'aside', 'section', 'header', 'footer'])(
			'does not warn for ::: %s',
			async tag => {
				const issues = await validate(`::: ${tag}\nContent\n:::`)
				expect(issues).toHaveLength(0)
			},
		)
	})

	describe('unknown tags produce warnings', () => {
		it('warns for an unknown tag name', async () => {
			const issues = await validate('::: banana\nContent\n:::')
			expect(issues).toHaveLength(1)
			expect(issues[0]!.severity).toBe('warning')
			expect(issues[0]!.code).toBe('unknown-fenced-div-tag')
			expect(issues[0]!.message).toContain('banana')
		})

		it('warns for an inline HTML element used as fenced div', async () => {
			const issues = await validate('::: span\nContent\n:::')
			expect(issues).toHaveLength(1)
			expect(issues[0]!.code).toBe('unknown-fenced-div-tag')
			expect(issues[0]!.message).toContain('span')
		})

		it('reports correct line position', async () => {
			const content = `# Title\n\nSome text\n\n::: banana\nContent\n:::`
			const issues = await validate(content)
			expect(issues).toHaveLength(1)
			expect(issues[0]!.range.start.line).toBe(4)
		})

		it('detects multiple unknown tags', async () => {
			const content = `::: foo\nA\n:::\n\n::: bar\nB\n:::`
			const issues = await validate(content)
			expect(issues).toHaveLength(2)
			expect(issues[0]!.message).toContain('foo')
			expect(issues[1]!.message).toContain('bar')
		})
	})

	describe('unnamed fenced divs are ignored', () => {
		it('does not warn for unnamed fenced divs', async () => {
			const issues = await validate('::: {.class}\nContent\n:::')
			expect(issues).toHaveLength(0)
		})
	})

	it('handles empty document', async () => {
		const issues = await validate('')
		expect(issues).toHaveLength(0)
	})

	it('handles document with no fenced divs', async () => {
		const issues = await validate('# Title\n\nJust text.')
		expect(issues).toHaveLength(0)
	})
})
