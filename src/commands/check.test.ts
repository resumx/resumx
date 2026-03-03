import {
	describe,
	it,
	expect,
	vi,
	beforeEach,
	afterEach,
	MockInstance,
} from 'vitest'
import { runCheck, printCheckResults } from './check.js'

// =============================================================================
// Test Fixtures
// =============================================================================

const VALID_RESUME = `# John Doe

> john@example.com | 555-123-4567

## Education

### University [2020 - 2024]{.right}

- GPA: 4.0
- Dean's List

## Work Experience

### Company [2024 - Present]{.right}

- Built scalable systems
- Led team of 5
`

const INVALID_RESUME = `## Education

### University

- Some content
`

const WARNING_RESUME = `# John Doe

> john@example.com

## Skills

Languages
: TypeScript
`

// =============================================================================
// runCheck tests
// =============================================================================

describe('runCheck', () => {
	it('should return ok=true for valid resume', async () => {
		const { ok, filteredIssues } = await runCheck(VALID_RESUME)

		expect(ok).toBe(true)
		expect(filteredIssues.filter(i => i.severity === 'critical')).toHaveLength(
			0,
		)
	})

	it('should return ok=false for resume with critical issues', async () => {
		const { ok, filteredIssues } = await runCheck(INVALID_RESUME)

		expect(ok).toBe(false)
		expect(filteredIssues.some(i => i.severity === 'critical')).toBe(true)
	})

	it('should return ok=true for warnings without --strict', async () => {
		const { ok } = await runCheck(WARNING_RESUME)

		expect(ok).toBe(true)
	})

	it('should return ok=false for warnings with --strict', async () => {
		const { ok, filteredIssues } = await runCheck(WARNING_RESUME, {
			strict: true,
		})

		expect(ok).toBe(false)
		expect(filteredIssues.length).toBeGreaterThan(0)
	})

	it('should filter issues by minSeverity', async () => {
		const { filteredIssues: allIssues } = await runCheck(WARNING_RESUME)
		const { filteredIssues: criticalOnly } = await runCheck(WARNING_RESUME, {
			minSeverity: 'critical',
		})

		expect(criticalOnly.length).toBeLessThanOrEqual(allIssues.length)
		expect(criticalOnly.every(i => i.severity === 'critical')).toBe(true)
	})

	it('should respect validate config passed via options', async () => {
		const body = `# John Doe

> john@example.com

## Skills

Languages
: TypeScript
`
		const { ok, filteredIssues } = await runCheck(body, {
			validateConfig: { extends: 'minimal', rules: { 'no-entries': 'off' } },
		})

		expect(ok).toBe(true)
		expect(filteredIssues.filter(i => i.code === 'no-entries')).toHaveLength(0)
	})

	it('should use default preset when no validate config provided', async () => {
		const { ok } = await runCheck(VALID_RESUME)
		expect(ok).toBe(true)
	})

	it('should not false-positive on YAML comments in frontmatter', async () => {
		const content = `---
output: output/
pages: 1 # Adjusts layout to fit within target page count
style:
  font-size: 11pt
  # font-family: 'Georgia', serif
  # header-align: center
---

# Your Name

[+1234567890](tel:+1234567890) | [your@email.com](mailto:your@email.com)

## Education

### University || 2020 - 2024

- GPA: 4.0
`
		const { ok, filteredIssues } = await runCheck(content)

		const contactIssues = filteredIssues.filter(
			i => i.code === 'missing-contact',
		)
		expect(contactIssues).toHaveLength(0)
		expect(ok).toBe(true)
	})
})

// =============================================================================
// printCheckResults tests
// =============================================================================

describe('printCheckResults', () => {
	let mockConsoleLog: MockInstance

	beforeEach(() => {
		mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('should print "No issues found" for empty issues', () => {
		printCheckResults([], 'resume.md')

		expect(mockConsoleLog).toHaveBeenCalled()
		const output = mockConsoleLog.mock.calls.map(c => c[0]).join('\n')
		expect(output).toContain('No issues found')
	})

	it('should print issues when present', async () => {
		const { filteredIssues } = await runCheck(INVALID_RESUME)
		printCheckResults(filteredIssues, 'resume.md')

		expect(mockConsoleLog).toHaveBeenCalled()
		const output = mockConsoleLog.mock.calls.map(c => c[0]).join('\n')
		expect(output).toContain('resume.md')
		expect(output).toContain('critical')
	})
})
