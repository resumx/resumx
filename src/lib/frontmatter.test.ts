import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { parseFrontmatter, parseFrontmatterFromString } from './frontmatter.js'

describe('frontmatter', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resumx-frontmatter-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	describe('parseFrontmatterFromString', () => {
		describe('YAML frontmatter', () => {
			it('parses YAML frontmatter with all fields', () => {
				const input = `---
themes: formal
output: ./dist/john-doe-resume
style:
  font-family: "Inter, sans-serif"
  section-header-color: "#2563eb"
---
# John Doe

Some content here.`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					themes: ['formal'],
					output: './dist/john-doe-resume',
					style: {
						'font-family': 'Inter, sans-serif',
						'section-header-color': '#2563eb',
					},
				})
				expect(result.content.trim()).toBe('# John Doe\n\nSome content here.')
			})

			it('parses YAML frontmatter with only themes', () => {
				const input = `---
themes: minimal
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ themes: ['minimal'] })
				expect(result.content.trim()).toBe('# Resume')
			})

			it('parses YAML frontmatter with only output (plain name)', () => {
				const input = `---
output: my-resume
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ output: 'my-resume' })
			})

			it('parses YAML frontmatter with output directory', () => {
				const input = `---
output: ./build/output/
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ output: './build/output/' })
			})

			it('parses YAML frontmatter with output template', () => {
				const input = `---
output: "build/John_Doe-{theme}-{role}"
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					output: 'build/John_Doe-{theme}-{role}',
				})
			})

			it('parses YAML frontmatter with only style', () => {
				const input = `---
style:
  primary-color: "#ff0000"
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					style: { 'primary-color': '#ff0000' },
				})
			})

			it('parses YAML frontmatter with multiple themes', () => {
				const input = `---
themes:
  - formal
  - minimal
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ themes: ['formal', 'minimal'] })
			})
		})

		describe('TOML frontmatter', () => {
			it('parses TOML frontmatter with all fields', () => {
				const input = `+++
themes = "formal"
output = "./dist/john-doe-resume"

[style]
font-family = "Inter, sans-serif"
section-header-color = "#2563eb"
+++
# John Doe

Some content here.`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					themes: ['formal'],
					output: './dist/john-doe-resume',
					style: {
						'font-family': 'Inter, sans-serif',
						'section-header-color': '#2563eb',
					},
				})
				expect(result.content.trim()).toBe('# John Doe\n\nSome content here.')
			})

			it('parses TOML frontmatter with only themes', () => {
				const input = `+++
themes = "minimal"
+++
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ themes: ['minimal'] })
			})

			it('parses TOML frontmatter with multiple themes', () => {
				const input = `+++
themes = ["formal", "minimal"]
+++
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ themes: ['formal', 'minimal'] })
			})

			it('parses TOML frontmatter with only style', () => {
				const input = `+++
[style]
primary-color = "#ff0000"
+++
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					style: { 'primary-color': '#ff0000' },
				})
			})
		})

		describe('no frontmatter', () => {
			it('returns null config when no frontmatter present', () => {
				const input = `# John Doe

Some content here.`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toBeNull()
				expect(result.content).toBe(input)
			})

			it('returns null config for empty content', () => {
				const result = parseFrontmatterFromString('')

				expect(result.config).toBeNull()
				expect(result.content).toBe('')
			})

			it('does not parse incomplete YAML delimiters', () => {
				const input = `---
themes: formal
# Missing closing delimiter
# John Doe`

				const result = parseFrontmatterFromString(input)

				// gray-matter should handle this gracefully
				// The exact behavior depends on gray-matter, but it shouldn't crash
				expect(result.content).toBeDefined()
			})
		})

		describe('stripping frontmatter', () => {
			it('strips YAML frontmatter completely', () => {
				const input = `---
themes: formal
---
# John Doe`

				const result = parseFrontmatterFromString(input)

				expect(result.content).not.toContain('---')
				expect(result.content).not.toContain('themes')
				expect(result.content.trim()).toBe('# John Doe')
			})

			it('strips TOML frontmatter completely', () => {
				const input = `+++
themes = "formal"
+++
# John Doe`

				const result = parseFrontmatterFromString(input)

				expect(result.content).not.toContain('+++')
				expect(result.content).not.toContain('themes')
				expect(result.content.trim()).toBe('# John Doe')
			})

			it('preserves content after frontmatter exactly', () => {
				const content = `# John Doe

## Experience

- Job 1
- Job 2`
				const input = `---
themes: formal
---
${content}`

				const result = parseFrontmatterFromString(input)

				expect(result.content.trim()).toBe(content)
			})
		})

		describe('validation', () => {
			it('throws on non-string/array themes', () => {
				const input = `---
themes: 123
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'themes' must be a string or an array of strings",
				)
			})

			it('throws on non-string themes array element', () => {
				const input = `---
themes:
  - formal
  - 123
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'themes' must contain only strings",
				)
			})

			it('normalizes string themes to single-element array', () => {
				const input = `---
themes: formal
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.themes).toEqual(['formal'])
			})

			it('throws on non-string output', () => {
				const input = `---
output: 123
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'output' must be a string",
				)
			})

			it('throws on non-object style', () => {
				const input = `---
style: "not-an-object"
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'style' must be an object",
				)
			})

			it('coerces numeric style values to strings', () => {
				const input = `---
style:
  line-height: 1.35
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.style?.['line-height']).toBe('1.35')
			})

			it('warns about unknown fields in frontmatter', () => {
				const input = `---
themes: formal
variables: some-value
anotherUnknown: 123
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ themes: ['formal'] })
				expect(result.warnings).toHaveLength(2)
				expect(result.warnings).toContain(
					"unknown frontmatter field 'variables' will be ignored",
				)
				expect(result.warnings).toContain(
					"unknown frontmatter field 'anotherUnknown' will be ignored",
				)
			})

			it('warns when roles is used in frontmatter', () => {
				const input = `---
roles: frontend
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toBeNull()
				expect(result.warnings).toContain(
					"unknown frontmatter field 'roles' will be ignored",
				)
			})

			it('warns when formats is used in frontmatter', () => {
				const input = `---
formats:
  - pdf
  - html
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toBeNull()
				expect(result.warnings).toContain(
					"unknown frontmatter field 'formats' will be ignored",
				)
			})

			it('returns empty warnings when all fields are known', () => {
				const input = `---
themes: formal
output: ./dist/my-resume
style:
  font-family: Arial
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.warnings).toEqual([])
			})
		})

		describe('pages field', () => {
			it('parses pages: 1 from YAML', () => {
				const input = `---
pages: 1
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.pages).toBe(1)
				expect(result.warnings).toEqual([])
			})

			it('parses pages: 2 from YAML', () => {
				const input = `---
pages: 2
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.pages).toBe(2)
			})

			it('parses pages from TOML', () => {
				const input = `+++
pages = 1
+++
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.pages).toBe(1)
			})

			it('parses pages alongside other fields', () => {
				const input = `---
themes: zurich
pages: 1
style:
  font-size: "10pt"
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					themes: ['zurich'],
					pages: 1,
					style: { 'font-size': '10pt' },
				})
			})

			it('throws on pages: 0', () => {
				const input = `---
pages: 0
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'pages' must be a positive integer (>= 1)",
				)
			})

			it('throws on negative pages', () => {
				const input = `---
pages: -1
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'pages' must be a positive integer (>= 1)",
				)
			})

			it('throws on non-integer pages', () => {
				const input = `---
pages: 1.5
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'pages' must be a positive integer (>= 1)",
				)
			})

			it('throws on non-number pages', () => {
				const input = `---
pages: "one"
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'pages' must be a positive integer (>= 1)",
				)
			})
		})

		describe('edge cases', () => {
			it('handles frontmatter with empty values', () => {
				const input = `---
themes: ""
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.themes).toEqual([''])
			})

			it('handles frontmatter with whitespace in values', () => {
				const input = `---
output: "my resume file"
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.output).toBe('my resume file')
			})

			it('handles frontmatter with special characters in style', () => {
				const input = `---
style:
  font-family: "Arial, 'Helvetica Neue', sans-serif"
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.style?.['font-family']).toBe(
					"Arial, 'Helvetica Neue', sans-serif",
				)
			})
		})
	})

	describe('parseFrontmatter', () => {
		it('parses YAML frontmatter from file', () => {
			const filePath = join(tempDir, 'resume.md')
			const content = `---
themes: formal
output: test-resume
---
# Test Person`

			writeFileSync(filePath, content)

			const result = parseFrontmatter(filePath)

			expect(result.config).toEqual({
				themes: ['formal'],
				output: 'test-resume',
			})
			expect(result.content.trim()).toBe('# Test Person')
		})

		it('parses TOML frontmatter from file', () => {
			const filePath = join(tempDir, 'resume.md')
			const content = `+++
themes = "minimal"
+++
# Test Person`

			writeFileSync(filePath, content)

			const result = parseFrontmatter(filePath)

			expect(result.config).toEqual({
				themes: ['minimal'],
			})
		})

		it('returns null config for file without frontmatter', () => {
			const filePath = join(tempDir, 'resume.md')
			const content = `# Test Person

No frontmatter here.`

			writeFileSync(filePath, content)

			const result = parseFrontmatter(filePath)

			expect(result.config).toBeNull()
			expect(result.content).toBe(content)
		})

		it('throws on file read error', () => {
			const filePath = join(tempDir, 'nonexistent.md')

			expect(() => parseFrontmatter(filePath)).toThrow()
		})
	})
})
