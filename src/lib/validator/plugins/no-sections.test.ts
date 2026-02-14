import { describe, it, expect } from 'vitest'
import { noSectionsPlugin } from './no-sections.js'
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
	return await noSectionsPlugin.validate(ctx)
}

// =============================================================================
// Tests
// =============================================================================

describe('noSectionsPlugin', () => {
	it('should have correct name', () => {
		expect(noSectionsPlugin.name).toBe('no-sections')
	})

	it('should detect missing H2 sections', async () => {
		const content = `# John Doe

> john@example.com

Just some text without sections.
`
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].severity).toBe('critical')
		expect(issues[0].code).toBe('no-sections')
	})

	it('should not flag when H2 exists', async () => {
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

Just some text without sections.
`
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].range.start.line).toBe(0)
		expect(issues[0].range.start.column).toBe(0)
	})

	it('should handle empty document', async () => {
		const issues = await validate('')

		expect(issues.length).toBe(1)
		expect(issues[0].code).toBe('no-sections')
	})
})
