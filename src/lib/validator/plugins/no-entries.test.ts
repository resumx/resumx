import { describe, it, expect } from 'vitest'
import { noEntriesPlugin } from './no-entries.js'
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
	return noEntriesPlugin.validate(ctx)
}

// =============================================================================
// Tests
// =============================================================================

describe('noEntriesPlugin', () => {
	it('should have correct name', () => {
		expect(noEntriesPlugin.name).toBe('no-entries')
	})

	it('should detect missing H3 entries as warning', async () => {
		const content = `# John Doe

> john@example.com

## Skills

Languages
: TypeScript, Python
`
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].severity).toBe('warning')
		expect(issues[0].code).toBe('no-entries')
	})

	it('should not flag when H3 exists', async () => {
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
		const content = `# John Doe

> john@example.com

## Skills

Languages
: TypeScript, Python
`
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].range.start.line).toBe(0)
		expect(issues[0].range.start.column).toBe(0)
	})

	it('should handle empty document', async () => {
		const issues = await validate('')

		expect(issues.length).toBe(1)
		expect(issues[0].code).toBe('no-entries')
	})
})
