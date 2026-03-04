import { describe, it, expect } from 'vitest'
import { spacedBracketedSpanPlugin } from './spaced-bracketed-span.js'
import { createMarkdownRenderer } from '../../markdown.js'
import type { ValidationContext } from '../types.js'

// =============================================================================
// Test Utilities
// =============================================================================

function createContext(content: string): ValidationContext {
	const md = createMarkdownRenderer()
	const tokens = md.parse(content, {})
	const lines = content.split('\n')
	return { content, tokens, lines }
}

async function validate(content: string) {
	const ctx = createContext(content)
	return await spacedBracketedSpanPlugin.validate(ctx)
}

// =============================================================================
// Tests
// =============================================================================

describe('spacedBracketedSpanPlugin', () => {
	it('should have correct name', () => {
		expect(spacedBracketedSpanPlugin.name).toBe('spaced-bracketed-span')
	})

	describe('detects spaced bracketed spans', () => {
		it('flags [text] {.class} with a single space', async () => {
			const issues = await validate('[hello] {.class}')

			expect(issues.length).toBe(1)
			expect(issues[0].severity).toBe('warning')
			expect(issues[0].code).toBe('spaced-bracketed-span')
			expect(issues[0].message).toContain(']')
			expect(issues[0].message).toContain('{')
		})

		it('flags [text]  {.class} with multiple spaces', async () => {
			const issues = await validate('[hello]  {.class}')

			expect(issues.length).toBe(1)
			expect(issues[0].code).toBe('spaced-bracketed-span')
		})

		it('flags tagged skills on separate lines', async () => {
			const content = [
				'## Technical Skills',
				'',
				'[TypeScript, React, Next.js] {.@frontend}',
				'[Go, Python, PostgreSQL] {.@backend}',
			].join('\n')
			const issues = await validate(content)

			expect(issues.length).toBe(2)
			expect(issues[0].range.start.line).toBe(2)
			expect(issues[1].range.start.line).toBe(3)
		})

		it('reports correct column for the match', async () => {
			const issues = await validate('Some text [hello] {.class}')

			expect(issues.length).toBe(1)
			expect(issues[0].range.start.column).toBe(10)
		})

		it('flags [text] {#id} with id attributes', async () => {
			const issues = await validate('[text] {#my-id}')

			expect(issues.length).toBe(1)
		})

		it('flags multiple occurrences on the same line', async () => {
			const issues = await validate('[first] {.a} [second] {.b}')

			expect(issues.length).toBe(2)
		})
	})

	describe('does not flag valid syntax', () => {
		it('ignores [text]{.class} without space', async () => {
			const issues = await validate('[hello]{.class}')

			expect(issues).toEqual([])
		})

		it('ignores plain text without brackets', async () => {
			const issues = await validate('regular text')

			expect(issues).toEqual([])
		})

		it('ignores list items with attrs', async () => {
			const issues = await validate('- Built a dashboard {.@frontend}')

			expect(issues).toEqual([])
		})

		it('ignores empty document', async () => {
			const issues = await validate('')

			expect(issues).toEqual([])
		})

		it('ignores code blocks', async () => {
			const content = ['```markdown', '[text] {.class}', '```'].join('\n')
			const issues = await validate(content)

			expect(issues).toEqual([])
		})

		it('ignores tilde code blocks', async () => {
			const content = ['~~~', '[text] {.class}', '~~~'].join('\n')
			const issues = await validate(content)

			expect(issues).toEqual([])
		})
	})

	describe('message quality', () => {
		it('suggests removing the space', async () => {
			const issues = await validate('[TypeScript, React] {.@frontend}')

			expect(issues.length).toBe(1)
			expect(issues[0].message).toContain('[TypeScript, React]{.@frontend}')
		})
	})
})
