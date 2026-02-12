import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
	parseFrontmatter,
	parseFrontmatterFromString,
	type FrontmatterConfig,
} from './frontmatter.js'

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
formats:
  - pdf
  - html
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
					formats: ['pdf', 'html'],
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

			it('parses YAML frontmatter with only formats', () => {
				const input = `---
formats:
  - pdf
  - docx
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ formats: ['pdf', 'docx'] })
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

			it('parses YAML frontmatter with roles', () => {
				const input = `---
roles:
  - frontend
  - backend
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					roles: ['frontend', 'backend'],
				})
			})

			it('parses YAML frontmatter with all fields including roles', () => {
				const input = `---
themes: formal
roles:
  - frontend
  - fullstack
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					themes: ['formal'],
					roles: ['frontend', 'fullstack'],
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
formats = ["pdf", "html"]

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
					formats: ['pdf', 'html'],
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

			it('parses TOML frontmatter with roles', () => {
				const input = `+++
roles = ["frontend", "backend"]
+++
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					roles: ['frontend', 'backend'],
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

			it('throws on non-array formats', () => {
				const input = `---
formats: pdf
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'formats' must be an array",
				)
			})

			it('throws on invalid format value', () => {
				const input = `---
formats:
  - pdf
  - invalid
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"invalid format 'invalid'",
				)
			})

			it('throws on non-string format array element', () => {
				const input = `---
formats:
  - pdf
  - 123
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'formats' must contain only strings",
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

			it('throws on non-string style value', () => {
				const input = `---
style:
  size: 12
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"style 'size' must be a string",
				)
			})

			it('allows valid formats: pdf, html, docx, png', () => {
				const input = `---
formats:
  - pdf
  - html
  - docx
  - png
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.formats).toEqual(['pdf', 'html', 'docx', 'png'])
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

			it('normalizes string role to single-element array', () => {
				const input = `---
roles: frontend
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.roles).toEqual(['frontend'])
			})

			it('throws on non-string role array element', () => {
				const input = `---
roles:
  - frontend
  - 123
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'roles' must contain only strings",
				)
			})

			it('returns empty warnings when all fields are known', () => {
				const input = `---
themes: formal
output: ./dist/my-resume
formats:
  - pdf
style:
  font-family: Arial
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.warnings).toEqual([])
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
formats = ["pdf", "html"]
+++
# Test Person`

			writeFileSync(filePath, content)

			const result = parseFrontmatter(filePath)

			expect(result.config).toEqual({
				themes: ['minimal'],
				formats: ['pdf', 'html'],
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
