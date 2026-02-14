import { describe, it, expect } from 'vitest'
import { singleBulletSectionPlugin } from './single-bullet-section.js'
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

describe('singleBulletSectionPlugin', () => {
	it('should have correct name', () => {
		expect(singleBulletSectionPlugin.name).toBe('single-bullet-section')
	})

	describe('SINGLE_BULLET_SECTION', () => {
		it('should detect sections with only 1 bullet', async () => {
			const ctx = createContext(SINGLE_BULLET_SECTION)
			const issues = await singleBulletSectionPlugin.validate(ctx)

			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)
			expect(singleBullets.length).toBe(1)
			expect(singleBullets[0].severity).toBe('bonus')
		})

		it('should include section name in message', async () => {
			const ctx = createContext(SINGLE_BULLET_SECTION)
			const issues = await singleBulletSectionPlugin.validate(ctx)

			const issue = issues.find(i => i.code === 'single-bullet-section')
			expect(issue?.message).toContain('Experience')
		})

		it('should detect multiple single-bullet sections', async () => {
			const ctx = createContext(MULTIPLE_SINGLE_BULLET_SECTIONS)
			const issues = await singleBulletSectionPlugin.validate(ctx)

			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)
			expect(singleBullets.length).toBe(2)
		})

		it('should not flag sections with multiple bullets', async () => {
			const ctx = createContext(VALID_RESUME)
			const issues = await singleBulletSectionPlugin.validate(ctx)

			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)
			expect(singleBullets.length).toBe(0)
		})

		it('should not flag sections with no bullets (e.g., definition lists)', async () => {
			const ctx = createContext(SECTION_WITHOUT_BULLETS)
			const issues = await singleBulletSectionPlugin.validate(ctx)

			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)
			expect(singleBullets.length).toBe(0)
		})
	})

	describe('edge cases', () => {
		it('should handle empty document', async () => {
			const ctx = createContext('')
			const issues = await singleBulletSectionPlugin.validate(ctx)
			expect(issues.length).toBe(0)
		})

		it('should handle document with no lists', async () => {
			const content = '# Name\n\n> email@test.com\n\n## Section\n\nJust text.'
			const ctx = createContext(content)
			const issues = await singleBulletSectionPlugin.validate(ctx)
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
			const ctx = createContext(content)
			const issues = await singleBulletSectionPlugin.validate(ctx)

			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)
			// Should count parent bullets, not nested
			expect(singleBullets.length).toBe(0)
		})

		it('should handle sections with zero bullets', async () => {
			const content = `# Name

> email@test.com

## Experience

Just some text, no bullets.

## Skills

More text without bullets.
`
			const ctx = createContext(content)
			const issues = await singleBulletSectionPlugin.validate(ctx)

			const singleBullets = issues.filter(
				i => i.code === 'single-bullet-section',
			)
			// Zero bullets should not trigger the single bullet warning
			expect(singleBullets.length).toBe(0)
		})
	})
})
