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
		tempDir = join(tmpdir(), `resum8-frontmatter-test-${Date.now()}`)
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
theme: formal
outputName: john-doe-resume
outputDir: ./dist
formats:
  - pdf
  - html
variables:
  font-family: "Inter, sans-serif"
  section-header-color: "#2563eb"
---
# John Doe

Some content here.`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					theme: ['formal'],
					outputName: 'john-doe-resume',
					outputDir: './dist',
					formats: ['pdf', 'html'],
					variables: {
						'font-family': 'Inter, sans-serif',
						'section-header-color': '#2563eb',
					},
				})
				expect(result.content.trim()).toBe('# John Doe\n\nSome content here.')
			})

			it('parses YAML frontmatter with only theme', () => {
				const input = `---
theme: minimal
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ theme: ['minimal'] })
				expect(result.content.trim()).toBe('# Resume')
			})

			it('parses YAML frontmatter with only outputName', () => {
				const input = `---
outputName: my-resume
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ outputName: 'my-resume' })
			})

			it('parses YAML frontmatter with only outputDir', () => {
				const input = `---
outputDir: ./build/output
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ outputDir: './build/output' })
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

			it('parses YAML frontmatter with only variables', () => {
				const input = `---
variables:
  primary-color: "#ff0000"
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					variables: { 'primary-color': '#ff0000' },
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
theme: formal
roles:
  - frontend
  - fullstack
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					theme: ['formal'],
					roles: ['frontend', 'fullstack'],
				})
			})

			it('parses YAML frontmatter with multiple themes', () => {
				const input = `---
theme:
  - formal
  - minimal
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ theme: ['formal', 'minimal'] })
			})
		})

		describe('TOML frontmatter', () => {
			it('parses TOML frontmatter with all fields', () => {
				const input = `+++
theme = "formal"
outputName = "john-doe-resume"
outputDir = "./dist"
formats = ["pdf", "html"]

[variables]
font-family = "Inter, sans-serif"
section-header-color = "#2563eb"
+++
# John Doe

Some content here.`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					theme: ['formal'],
					outputName: 'john-doe-resume',
					outputDir: './dist',
					formats: ['pdf', 'html'],
					variables: {
						'font-family': 'Inter, sans-serif',
						'section-header-color': '#2563eb',
					},
				})
				expect(result.content.trim()).toBe('# John Doe\n\nSome content here.')
			})

			it('parses TOML frontmatter with only theme', () => {
				const input = `+++
theme = "minimal"
+++
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ theme: ['minimal'] })
			})

			it('parses TOML frontmatter with multiple themes', () => {
				const input = `+++
theme = ["formal", "minimal"]
+++
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ theme: ['formal', 'minimal'] })
			})

			it('parses TOML frontmatter with only variables', () => {
				const input = `+++
[variables]
primary-color = "#ff0000"
+++
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({
					variables: { 'primary-color': '#ff0000' },
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
theme: formal
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
theme: formal
---
# John Doe`

				const result = parseFrontmatterFromString(input)

				expect(result.content).not.toContain('---')
				expect(result.content).not.toContain('theme')
				expect(result.content.trim()).toBe('# John Doe')
			})

			it('strips TOML frontmatter completely', () => {
				const input = `+++
theme = "formal"
+++
# John Doe`

				const result = parseFrontmatterFromString(input)

				expect(result.content).not.toContain('+++')
				expect(result.content).not.toContain('theme')
				expect(result.content.trim()).toBe('# John Doe')
			})

			it('preserves content after frontmatter exactly', () => {
				const content = `# John Doe

## Experience

- Job 1
- Job 2`
				const input = `---
theme: formal
---
${content}`

				const result = parseFrontmatterFromString(input)

				expect(result.content.trim()).toBe(content)
			})
		})

		describe('validation', () => {
			it('throws on non-string/array theme', () => {
				const input = `---
theme: 123
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'theme' must be a string or an array of strings",
				)
			})

			it('throws on non-string theme array element', () => {
				const input = `---
theme:
  - formal
  - 123
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'theme' must contain only strings",
				)
			})

			it('normalizes string theme to single-element array', () => {
				const input = `---
theme: formal
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.theme).toEqual(['formal'])
			})

			it('throws on non-string outputName', () => {
				const input = `---
outputName: 123
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'outputName' must be a string",
				)
			})

			it('throws on non-string outputDir', () => {
				const input = `---
outputDir: 123
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'outputDir' must be a string",
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

			it('throws on non-object variables', () => {
				const input = `---
variables: "not-an-object"
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"'variables' must be an object",
				)
			})

			it('throws on non-string variable value', () => {
				const input = `---
variables:
  size: 12
---
# Resume`

				expect(() => parseFrontmatterFromString(input)).toThrow(
					"variable 'size' must be a string",
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
theme: formal
unknownField: some-value
anotherUnknown: 123
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config).toEqual({ theme: ['formal'] })
				expect(result.warnings).toHaveLength(2)
				expect(result.warnings).toContain(
					"unknown frontmatter field 'unknownField' will be ignored",
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
theme: formal
outputName: my-resume
outputDir: ./dist
formats:
  - pdf
variables:
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
theme: ""
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.theme).toEqual([''])
			})

			it('handles frontmatter with whitespace in values', () => {
				const input = `---
outputName: "my resume file"
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.outputName).toBe('my resume file')
			})

			it('handles frontmatter with special characters in variables', () => {
				const input = `---
variables:
  font-family: "Arial, 'Helvetica Neue', sans-serif"
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.config?.variables?.['font-family']).toBe(
					"Arial, 'Helvetica Neue', sans-serif",
				)
			})
		})
	})

	describe('parseFrontmatter', () => {
		it('parses YAML frontmatter from file', () => {
			const filePath = join(tempDir, 'resume.md')
			const content = `---
theme: formal
outputName: test-resume
---
# Test Person`

			writeFileSync(filePath, content)

			const result = parseFrontmatter(filePath)

			expect(result.config).toEqual({
				theme: ['formal'],
				outputName: 'test-resume',
			})
			expect(result.content.trim()).toBe('# Test Person')
		})

		it('parses TOML frontmatter from file', () => {
			const filePath = join(tempDir, 'resume.md')
			const content = `+++
theme = "minimal"
formats = ["pdf", "html"]
+++
# Test Person`

			writeFileSync(filePath, content)

			const result = parseFrontmatter(filePath)

			expect(result.config).toEqual({
				theme: ['minimal'],
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
