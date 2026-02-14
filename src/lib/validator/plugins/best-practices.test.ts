import { describe, it, expect } from 'vitest'
import { createLongBulletPlugin, longBulletPlugin } from './long-bullet.js'
import { singleBulletSectionPlugin } from './single-bullet-section.js'
import { createMarkdownRenderer } from '../../markdown.js'
import type { ValidationContext, ValidationIssue } from '../types.js'

// =============================================================================
// Test Utilities
// =============================================================================

function createContext(content: string): ValidationContext {
	const md = createMarkdownRenderer()
	const tokens = md.parse(content, {})
	const lines = content.split('\n')
	return { content, tokens, lines }
}

async function validateWithAllPlugins(
	content: string,
): Promise<ValidationIssue[]> {
	const ctx = createContext(content)
	const results = await Promise.all([
		longBulletPlugin.validate(ctx),
		singleBulletSectionPlugin.validate(ctx),
	])
	return results.flat()
}

// =============================================================================
// Test Fixtures
// =============================================================================

const VALID_RESUME = `# John Doe

> john@example.com

## Education

### University [2020 – 2024]{.right}

- GPA: 4.0
- Dean's List

## Work Experience

### Company [2024 – Present]{.right}

- Built scalable systems
- Led team of 5 engineers
`

const LONG_BULLET = `# John Doe

> john@example.com

## Experience

### Company

- This is a very long bullet point that exceeds the recommended maximum length of 200 characters. It goes on and on describing achievements and responsibilities in great detail, which makes it harder to read quickly on a resume and should be shortened.
`

const SINGLE_BULLET_SECTION = `# John Doe

> john@example.com

## Experience

### Company

- Only one bullet here
`

const MULTIPLE_SINGLE_BULLET_SECTIONS = `# John Doe

> john@example.com

## Education

### University

- Single bullet

## Experience

### Company

- Another single bullet
`

const SECTION_WITHOUT_BULLETS = `# John Doe

> john@example.com

## Skills

Languages
: TypeScript, Python
`

// =============================================================================
// Tests
// =============================================================================

describe('best-practice plugins', () => {
	it('should export individual plugins', () => {
		expect(longBulletPlugin).toBeDefined()
		expect(singleBulletSectionPlugin).toBeDefined()
		expect(createLongBulletPlugin).toBeDefined()
	})

	describe('long-bullet', () => {
		it('should detect bullets exceeding 200 characters with critical severity', async () => {
			const issues = await validateWithAllPlugins(LONG_BULLET)
			const longBullets = issues.filter(i => i.code === 'long-bullet')

			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('critical')
			expect(longBullets[0].message).toContain('200')
		})

		it('should detect bullets between 141-200 characters with warning severity', async () => {
			const text = 'A'.repeat(180)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const issues = await validateWithAllPlugins(content)
			const longBullets = issues.filter(i => i.code === 'long-bullet')

			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('warning')
			expect(longBullets[0].message).toContain('140')
		})

		it('should include character count in message', async () => {
			const issues = await validateWithAllPlugins(LONG_BULLET)
			const issue = issues.find(i => i.code === 'long-bullet')

			// Message should include actual length
			expect(issue?.message).toMatch(/\(\d+\)/)
		})

		it('should not flag bullets under 140 characters', async () => {
			const issues = await validateWithAllPlugins(VALID_RESUME)
			const longBullets = issues.filter(i => i.code === 'long-bullet')

			expect(longBullets.length).toBe(0)
		})

		it('should handle bullet exactly at 140 characters (no issue)', async () => {
			const text = 'A'.repeat(140)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const issues = await validateWithAllPlugins(content)
			const longBullets = issues.filter(i => i.code === 'long-bullet')

			expect(longBullets.length).toBe(0)
		})

		it('should handle bullet at 141 characters (warning)', async () => {
			const text = 'A'.repeat(141)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const issues = await validateWithAllPlugins(content)
			const longBullets = issues.filter(i => i.code === 'long-bullet')

			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('warning')
		})

		it('should handle bullet at 201 characters (critical)', async () => {
			const text = 'A'.repeat(201)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const issues = await validateWithAllPlugins(content)
			const longBullets = issues.filter(i => i.code === 'long-bullet')

			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('critical')
		})
	})

	describe('single-bullet-section', () => {
		it('should detect sections with only 1 bullet', async () => {
			const issues = await validateWithAllPlugins(SINGLE_BULLET_SECTION)
			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)

			expect(singleBullets.length).toBe(1)
			expect(singleBullets[0].severity).toBe('bonus')
		})

		it('should include section name in message', async () => {
			const issues = await validateWithAllPlugins(SINGLE_BULLET_SECTION)
			const issue = issues.find(i => i.code === 'single-bullet-section')

			expect(issue?.message).toContain('Experience')
		})

		it('should detect multiple single-bullet sections', async () => {
			const issues = await validateWithAllPlugins(
				MULTIPLE_SINGLE_BULLET_SECTIONS,
			)
			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)

			expect(singleBullets.length).toBe(2)
		})

		it('should not flag sections with multiple bullets', async () => {
			const issues = await validateWithAllPlugins(VALID_RESUME)
			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)

			expect(singleBullets.length).toBe(0)
		})

		it('should not flag sections with no bullets (e.g., definition lists)', async () => {
			const issues = await validateWithAllPlugins(SECTION_WITHOUT_BULLETS)
			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)

			expect(singleBullets.length).toBe(0)
		})
	})

	describe('combined checks', () => {
		it('should return both long-bullet and single-bullet-section if applicable', async () => {
			const longText = 'A'.repeat(250)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${longText}`
			const issues = await validateWithAllPlugins(content)

			const longBullets = issues.filter(i => i.code === 'long-bullet')
			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)

			expect(longBullets.length).toBe(1)
			expect(singleBullets.length).toBe(1)
		})
	})

	describe('edge cases', () => {
		it('should handle empty document', async () => {
			const issues = await validateWithAllPlugins('')
			expect(issues.length).toBe(0)
		})

		it('should handle document with no lists', async () => {
			const content = '# Name\n\n> email@test.com\n\n## Section\n\nJust text.'
			const issues = await validateWithAllPlugins(content)
			expect(issues.length).toBe(0)
		})

		it('should handle nested lists', async () => {
			const content = `# Name

> email@test.com

## Experience

### Company

- Parent item
  - Nested 1
  - Nested 2
- Another parent
`
			const issues = await validateWithAllPlugins(content)
			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)

			// Should count parent bullets, not nested
			expect(singleBullets.length).toBe(0)
		})
	})
})
