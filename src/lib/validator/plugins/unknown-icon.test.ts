import { describe, it, expect } from 'vitest'
import { unknownIconPlugin } from './unknown-icon.js'
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
	return await unknownIconPlugin.validate(ctx)
}

// =============================================================================
// Tests
// =============================================================================

describe('unknownIconPlugin', () => {
	it('should have correct name', () => {
		expect(unknownIconPlugin.name).toBe('unknown-icon')
	})

	it('should detect unknown icon references', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\n::nonexistent-icon::'
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].severity).toBe('warning')
		expect(issues[0].code).toBe('unknown-icon')
		expect(issues[0].message).toContain('nonexistent-icon')
	})

	it('should detect multiple unknown icons', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\n::fake1:: ::fake2:: ::fake3::'
		const issues = await validate(content)

		expect(issues.length).toBe(3)
	})

	it('should not flag known devicon icons', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\n::react:: ::typescript:: ::python::'
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should not flag known logos icons', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\n::netflix:: ::spotify::'
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should not flag Iconify format icons (with colon)', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\n::mdi:home:: ::fa:user:: ::devicon:react::'
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should not flag wiki: prefix icons', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\n::wiki:path/to/icon.svg::'
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should not flag wikimedia-commons: prefix icons', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\n::wikimedia-commons:path/to/icon.svg::'
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should not flag gh: prefix icons', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\n::gh:octocat:: ::gh:facebook/react::'
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should not flag github: prefix icons', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\n::github:microsoft::'
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should provide accurate range with column position', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\nPrefix ::unknown-icon:: suffix'
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].range.start.column).toBe(7) // After "Prefix "
		expect(issues[0].range.end.column).toBe(23) // End of ::unknown-icon::
	})

	it('should handle empty document', async () => {
		const issues = await validate('')
		expect(issues.length).toBe(0)
	})

	it('should handle document with no icons', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\nJust text, no icons.'
		const issues = await validate(content)
		expect(issues.length).toBe(0)
	})

	it('should handle single colons (not icon syntax)', async () => {
		const content = '# Name\n\n> email@test.com\n\n## Skills\n\nTime: 12:30'
		const issues = await validate(content)
		expect(issues.length).toBe(0)
	})

	it('should handle mixed valid and invalid icons', async () => {
		const content =
			'# Name\n\n> email@test.com\n\n## Skills\n\n::react:: ::invalid:: ::typescript::'
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].message).toContain('invalid')
	})
})
