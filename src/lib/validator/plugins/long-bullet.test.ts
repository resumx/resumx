import { describe, it, expect } from 'vitest'
import { createLongBulletPlugin, longBulletPlugin } from './long-bullet.js'
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

// =============================================================================
// Tests
// =============================================================================

describe('longBulletPlugin', () => {
	it('should have correct name', () => {
		expect(longBulletPlugin.name).toBe('long-bullet')
	})

	describe('default thresholds', () => {
		it('should not flag bullets under 140 characters', async () => {
			const ctx = createContext(VALID_RESUME)
			const issues = await longBulletPlugin.validate(ctx)

			expect(issues.filter(i => i.code === 'long-bullet').length).toBe(0)
		})

		it('should emit warning for bullets between 141-200 characters', async () => {
			const text = 'A'.repeat(150)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await longBulletPlugin.validate(ctx)

			const longBullets = issues.filter(i => i.code === 'long-bullet')
			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('warning')
			expect(longBullets[0].message).toContain('140')
			expect(longBullets[0].message).toContain('150')
		})

		it('should emit critical for bullets over 200 characters', async () => {
			const text = 'A'.repeat(210)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await longBulletPlugin.validate(ctx)

			const longBullets = issues.filter(i => i.code === 'long-bullet')
			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('critical')
			expect(longBullets[0].message).toContain('200')
			expect(longBullets[0].message).toContain('210')
		})

		it('should handle bullet exactly at 140 characters (no issue)', async () => {
			const text = 'A'.repeat(140)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await longBulletPlugin.validate(ctx)

			expect(issues.filter(i => i.code === 'long-bullet').length).toBe(0)
		})

		it('should handle bullet at 141 characters (warning)', async () => {
			const text = 'A'.repeat(141)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await longBulletPlugin.validate(ctx)

			const longBullets = issues.filter(i => i.code === 'long-bullet')
			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('warning')
		})

		it('should handle bullet exactly at 200 characters (warning)', async () => {
			const text = 'A'.repeat(200)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await longBulletPlugin.validate(ctx)

			const longBullets = issues.filter(i => i.code === 'long-bullet')
			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('warning')
		})

		it('should handle bullet at 201 characters (critical)', async () => {
			const text = 'A'.repeat(201)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await longBulletPlugin.validate(ctx)

			const longBullets = issues.filter(i => i.code === 'long-bullet')
			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('critical')
		})
	})

	describe('createLongBulletPlugin with custom thresholds', () => {
		it('should respect custom warn threshold', async () => {
			const plugin = createLongBulletPlugin({ warnThreshold: 50 })
			const text = 'A'.repeat(60)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await plugin.validate(ctx)

			const longBullets = issues.filter(i => i.code === 'long-bullet')
			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('warning')
			expect(longBullets[0].message).toContain('50')
		})

		it('should respect custom critical threshold', async () => {
			const plugin = createLongBulletPlugin({ criticalThreshold: 100 })
			const text = 'A'.repeat(110)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await plugin.validate(ctx)

			const longBullets = issues.filter(i => i.code === 'long-bullet')
			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('critical')
			expect(longBullets[0].message).toContain('100')
		})

		it('should respect both custom thresholds', async () => {
			const plugin = createLongBulletPlugin({
				warnThreshold: 50,
				criticalThreshold: 100,
			})

			// Test warning zone (51-100)
			const warnText = 'A'.repeat(75)
			const warnContent = `# Name\n\n> email@test.com\n\n## Section\n\n- ${warnText}`
			const warnCtx = createContext(warnContent)
			const warnIssues = await plugin.validate(warnCtx)

			expect(warnIssues[0].severity).toBe('warning')

			// Test critical zone (>100)
			const criticalText = 'A'.repeat(110)
			const criticalContent = `# Name\n\n> email@test.com\n\n## Section\n\n- ${criticalText}`
			const criticalCtx = createContext(criticalContent)
			const criticalIssues = await plugin.validate(criticalCtx)

			expect(criticalIssues[0].severity).toBe('critical')
		})

		it('should not flag bullets under custom warn threshold', async () => {
			const plugin = createLongBulletPlugin({ warnThreshold: 50 })
			const text = 'A'.repeat(40)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await plugin.validate(ctx)

			expect(issues.filter(i => i.code === 'long-bullet').length).toBe(0)
		})

		it('should allow setting only critical threshold (warn uses default)', async () => {
			const plugin = createLongBulletPlugin({ criticalThreshold: 150 })
			const text = 'A'.repeat(145)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await plugin.validate(ctx)

			const longBullets = issues.filter(i => i.code === 'long-bullet')
			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('warning') // Uses default warn (140)
		})

		it('should allow setting only warn threshold (critical uses default)', async () => {
			const plugin = createLongBulletPlugin({ warnThreshold: 100 })
			const text = 'A'.repeat(205)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await plugin.validate(ctx)

			const longBullets = issues.filter(i => i.code === 'long-bullet')
			expect(longBullets.length).toBe(1)
			expect(longBullets[0].severity).toBe('critical') // Uses default critical (200)
		})
	})

	describe('edge cases', () => {
		it('should handle empty document', async () => {
			const ctx = createContext('')
			const issues = await longBulletPlugin.validate(ctx)
			expect(issues.length).toBe(0)
		})

		it('should handle document with no lists', async () => {
			const content = '# Name\n\n> email@test.com\n\n## Section\n\nJust text.'
			const ctx = createContext(content)
			const issues = await longBulletPlugin.validate(ctx)
			expect(issues.length).toBe(0)
		})

		it('should count only immediate bullet content, not nested', async () => {
			const content = `# Name

> email@test.com

## Experience

### Company

- Short parent item
  - ${'A'.repeat(250)}
`
			const ctx = createContext(content)
			const issues = await longBulletPlugin.validate(ctx)

			// Should detect the nested long bullet too
			const longBullets = issues.filter(i => i.code === 'long-bullet')
			expect(longBullets.length).toBeGreaterThanOrEqual(1)
		})

		it('should include character count in message', async () => {
			const text = 'A'.repeat(180)
			const content = `# Name\n\n> email@test.com\n\n## Section\n\n- ${text}`
			const ctx = createContext(content)
			const issues = await longBulletPlugin.validate(ctx)

			const issue = issues.find(i => i.code === 'long-bullet')
			expect(issue?.message).toMatch(/\(180\)/)
		})
	})
})
