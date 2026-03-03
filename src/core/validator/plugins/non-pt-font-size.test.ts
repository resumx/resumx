import { describe, it, expect } from 'vitest'
import { nonPtFontSizePlugin } from './non-pt-font-size.js'
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
	return await nonPtFontSizePlugin.validate(ctx)
}

// =============================================================================
// Test Fixtures
// =============================================================================

const RESUME_BODY = `# John Doe

> john@example.com

## Experience

### Company

- Did stuff
`

function withStyle(style: string): string {
	return `---\nstyle:\n  ${style}\n---\n\n${RESUME_BODY}`
}

// =============================================================================
// Tests
// =============================================================================

describe('nonPtFontSizePlugin', () => {
	it('should have correct name', () => {
		expect(nonPtFontSizePlugin.name).toBe('non-pt-font-size')
	})

	describe('valid pt values produce no issues', () => {
		it('does not warn when font-size uses pt', async () => {
			const issues = await validate(withStyle('font-size: 11pt'))
			expect(issues).toHaveLength(0)
		})

		it('does not warn when font-size uses pt with different value', async () => {
			const issues = await validate(withStyle('font-size: 10pt'))
			expect(issues).toHaveLength(0)
		})

		it('does not warn when there is no style block', async () => {
			const issues = await validate(RESUME_BODY)
			expect(issues).toHaveLength(0)
		})

		it('does not warn when style block does not include font-size', async () => {
			const issues = await validate(withStyle('text-color: "#333"'))
			expect(issues).toHaveLength(0)
		})

		it('does not warn when font-size is a unitless value', async () => {
			const issues = await validate(withStyle('line-height: 1.3'))
			expect(issues).toHaveLength(0)
		})
	})

	describe('non-pt units produce a warning', () => {
		it('warns when font-size uses px', async () => {
			const issues = await validate(withStyle('font-size: 16px'))
			expect(issues).toHaveLength(1)
			expect(issues[0]!.severity).toBe('warning')
			expect(issues[0]!.code).toBe('non-pt-font-size')
		})

		it('warns when font-size uses em', async () => {
			const issues = await validate(withStyle('font-size: 1em'))
			expect(issues).toHaveLength(1)
			expect(issues[0]!.code).toBe('non-pt-font-size')
		})

		it('warns when font-size uses rem', async () => {
			const issues = await validate(withStyle('font-size: 1rem'))
			expect(issues).toHaveLength(1)
			expect(issues[0]!.code).toBe('non-pt-font-size')
		})

		it('warns when font-size uses vw', async () => {
			const issues = await validate(withStyle('font-size: 2vw'))
			expect(issues).toHaveLength(1)
			expect(issues[0]!.code).toBe('non-pt-font-size')
		})

		it('warns when font-size uses %', async () => {
			const issues = await validate(withStyle('font-size: 120%'))
			expect(issues).toHaveLength(1)
			expect(issues[0]!.code).toBe('non-pt-font-size')
		})
	})

	describe('warning message quality', () => {
		it('includes the actual unit in the message', async () => {
			const issues = await validate(withStyle('font-size: 16px'))
			expect(issues[0]!.message).toContain('px')
		})

		it('includes pt as the recommended unit in the message', async () => {
			const issues = await validate(withStyle('font-size: 16px'))
			expect(issues[0]!.message).toContain('pt')
		})
	})

	describe('range', () => {
		it('points to the frontmatter region (line 0)', async () => {
			const issues = await validate(withStyle('font-size: 16px'))
			expect(issues[0]!.range.start.line).toBe(0)
		})
	})

	describe('TOML frontmatter', () => {
		it('warns when font-size uses px in TOML frontmatter', async () => {
			const content = `+++\n[style]\nfont-size = "16px"\n+++\n\n${RESUME_BODY}`
			const issues = await validate(content)
			expect(issues).toHaveLength(1)
			expect(issues[0]!.code).toBe('non-pt-font-size')
		})

		it('does not warn when font-size uses pt in TOML frontmatter', async () => {
			const content = `+++\n[style]\nfont-size = "11pt"\n+++\n\n${RESUME_BODY}`
			const issues = await validate(content)
			expect(issues).toHaveLength(0)
		})
	})
})
