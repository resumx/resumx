import { describe, it, expect } from 'vitest'
import { missingNamePlugin } from './missing-name.js'
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
	return await missingNamePlugin.validate(ctx)
}

// =============================================================================
// Tests
// =============================================================================

describe('missingNamePlugin', () => {
	it('should have correct name', () => {
		expect(missingNamePlugin.name).toBe('missing-name')
	})

	it('should detect missing H1 heading', async () => {
		const content = `## Education

### University

- Some content
`
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].severity).toBe('critical')
		expect(issues[0].code).toBe('missing-name')
		expect(issues[0].message).toContain('name')
	})

	it('should not flag when H1 exists', async () => {
		const content = `# John Doe

> john@example.com

## Education

### University

- Content
`
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should provide range at start for document-level issues', async () => {
		const content = `## Education

### University

- Some content
`
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].range.start.line).toBe(0)
		expect(issues[0].range.start.column).toBe(0)
	})

	it('should handle empty document', async () => {
		const issues = await validate('')

		expect(issues.length).toBe(1)
		expect(issues[0].code).toBe('missing-name')
	})
})
