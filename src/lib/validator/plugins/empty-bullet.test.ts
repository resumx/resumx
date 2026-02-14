import { describe, it, expect } from 'vitest'
import { emptyBulletPlugin } from './empty-bullet.js'
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
	return await emptyBulletPlugin.validate(ctx)
}

// =============================================================================
// Tests
// =============================================================================

describe('emptyBulletPlugin', () => {
	it('should have correct name', () => {
		expect(emptyBulletPlugin.name).toBe('empty-bullet')
	})

	it('should detect empty bullet points', async () => {
		const content = `# Name

> email@test.com

## Experience

- 
- Valid bullet
`
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].severity).toBe('critical')
		expect(issues[0].code).toBe('empty-bullet')
	})

	it('should detect multiple empty bullets', async () => {
		const content = `# Name

> email@test.com

## Experience

- 
- 
- Valid
`
		const issues = await validate(content)

		expect(issues.length).toBe(2)
	})

	it('should detect whitespace-only bullets as empty', async () => {
		const content = `# Name

> email@test.com

## Experience

-    
- Valid bullet
`
		const issues = await validate(content)

		expect(issues.length).toBe(1)
	})

	it('should not flag valid bullets', async () => {
		const content = `# Name

> email@test.com

## Experience

- Built scalable systems
- Led team of 5 engineers
- Improved performance by 50%
`
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should handle nested lists correctly', async () => {
		const content = `# Name

> email@test.com

## Experience

- Parent item
  - Nested item 1
  - Nested item 2
- Another parent
`
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should provide accurate range information', async () => {
		const content = `# Name

> email@test.com

## Experience

- 
- Valid bullet
`
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].range.start.line).toBeGreaterThan(0)
	})

	it('should handle empty document', async () => {
		const issues = await validate('')

		expect(issues.length).toBe(0)
	})

	it('should handle document with no lists', async () => {
		const content = '# Name\n\n> email@test.com\n\n## Section\n\nJust text.'
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should handle bullets with only code', async () => {
		const content = '# Name\n\n> email@test.com\n\n## Skills\n\n- `TypeScript`'
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})
})
