import { describe, it, expect } from 'vitest'
import { missingContactPlugin } from './missing-contact.js'
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
	return await missingContactPlugin.validate(ctx)
}

// =============================================================================
// Tests
// =============================================================================

describe('missingContactPlugin', () => {
	it('should have correct name', () => {
		expect(missingContactPlugin.name).toBe('missing-contact')
	})

	it('should detect missing contact info after H1', async () => {
		const content = `# John Doe

## Education

### University

- Some content
`
		const issues = await validate(content)

		expect(issues.length).toBe(1)
		expect(issues[0].severity).toBe('critical')
		expect(issues[0].code).toBe('missing-contact')
	})

	it('should accept email in blockquote', async () => {
		const content = `# John Doe

> john@example.com

## Education

### University

- Content
`
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should accept email in paragraph', async () => {
		const content = `# John Doe

john@example.com

## Education

### University

- Content
`
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should accept phone number as contact', async () => {
		const content = `# John Doe

> 555-123-4567

## Skills

### Programming

- TypeScript
`
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should detect various email formats', async () => {
		const emails = [
			'test@example.com',
			'name.surname@company.org',
			'user+tag@domain.co.uk',
		]

		for (const email of emails) {
			const content = `# Name\n\n> ${email}\n\n## Section\n`
			const issues = await validate(content)
			expect(issues.length).toBe(0)
		}
	})

	it('should detect various phone formats', async () => {
		const phones = [
			'555-123-4567',
			'(555) 123-4567',
			'+1 555 123 4567',
			'555.123.4567',
		]

		for (const phone of phones) {
			const content = `# Name\n\n> ${phone}\n\n## Section\n`
			const issues = await validate(content)
			expect(issues.length).toBe(0)
		}
	})

	it('should accept contact info in a later paragraph (not immediately after H1)', async () => {
		const content = `# Adrian Sterling

Java Developer

[+1 555-123-4567](tel:+15551234567)

<adrian.sterling@email.com>

[in/adriansterling](https://linkedin.com/in/adriansterling)

## Education

### University

- Content
`
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should detect contact via mailto: link href', async () => {
		const content = `# John Doe

[Contact Me](mailto:john@example.com)

## Education
`
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should detect contact via tel: link href', async () => {
		const content = `# John Doe

[Call Me](tel:+15551234567)

## Education
`
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should accept contact after a title/subtitle paragraph', async () => {
		const content = `# Jane Smith

Senior Software Engineer

jane@example.com

## Experience
`
		const issues = await validate(content)

		expect(issues.length).toBe(0)
	})

	it('should not flag when no H1 exists (handled by missing-name)', async () => {
		const content = `## Education

### University

- Some content
`
		const issues = await validate(content)

		// Missing contact only checks when H1 exists
		expect(issues.length).toBe(0)
	})
})
