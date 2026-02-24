import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert'
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
				assert(result.ok)

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
				assert(result.ok)

				expect(result.config).toEqual({ themes: ['minimal'] })
				expect(result.content.trim()).toBe('# Resume')
			})

			it('parses YAML frontmatter with only output (plain name)', () => {
				const input = `---
output: my-resume
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config).toEqual({ output: 'my-resume' })
			})

			it('parses YAML frontmatter with output directory', () => {
				const input = `---
output: ./build/output/
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config).toEqual({ output: './build/output/' })
			})

			it('parses YAML frontmatter with output template', () => {
				const input = `---
output: "build/John_Doe-{theme}-{role}"
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

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
				assert(result.ok)

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
				assert(result.ok)

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
				assert(result.ok)

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
				assert(result.ok)

				expect(result.config).toEqual({ themes: ['minimal'] })
			})

			it('parses TOML frontmatter with multiple themes', () => {
				const input = `+++
themes = ["formal", "minimal"]
+++
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config).toEqual({ themes: ['formal', 'minimal'] })
			})

			it('parses TOML frontmatter with only style', () => {
				const input = `+++
[style]
primary-color = "#ff0000"
+++
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

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
				assert(result.ok)

				expect(result.config).toBeNull()
				expect(result.content).toBe(input)
			})

			it('returns null config for empty content', () => {
				const result = parseFrontmatterFromString('')
				assert(result.ok)

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
				if (result.ok) {
					expect(result.content).toBeDefined()
				}
			})
		})

		describe('stripping frontmatter', () => {
			it('strips YAML frontmatter completely', () => {
				const input = `---
themes: formal
---
# John Doe`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

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
				assert(result.ok)

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
				assert(result.ok)

				expect(result.content.trim()).toBe(content)
			})
		})

		describe('validation', () => {
			it('rejects non-string/array themes', () => {
				const input = `---
themes: 123
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "'themes' must be a string or an array of strings",
				})
			})

			it('rejects non-string themes array element', () => {
				const input = `---
themes:
  - formal
  - 123
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "'themes' must contain only strings",
				})
			})

			it('normalizes string themes to single-element array', () => {
				const input = `---
themes: formal
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.themes).toEqual(['formal'])
			})

			it('rejects non-string output', () => {
				const input = `---
output: 123
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "'output' must be a string",
				})
			})

			it('rejects non-object style', () => {
				const input = `---
style: "not-an-object"
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "'style' must be an object",
				})
			})

			it('coerces numeric style values to strings', () => {
				const input = `---
style:
  line-height: 1.35
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.style?.['line-height']).toBe('1.35')
			})

			it('rejects unknown fields with suggestion to use extra', () => {
				const input = `---
themes: formal
variables: some-value
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error:
						"Unknown frontmatter field 'variables'. Use 'extra' for custom fields.",
				})
			})

			it('rejects roles with non-object value', () => {
				const input = `---
roles: frontend
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.ok).toBe(false)
			})

			it('rejects formats as unknown field', () => {
				const input = `---
formats:
  - pdf
  - html
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error:
						"Unknown frontmatter field 'formats'. Use 'extra' for custom fields.",
				})
			})

			it('rejects likely typo: page instead of pages', () => {
				const input = `---
page: 2
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "Unknown frontmatter field 'page'. Did you mean 'pages'?",
				})
			})

			it('rejects likely typo: theme instead of themes', () => {
				const input = `---
theme: formal
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "Unknown frontmatter field 'theme'. Did you mean 'themes'?",
				})
			})

			it('rejects likely typo: styles instead of style', () => {
				const input = `---
styles:
  font-family: Arial
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "Unknown frontmatter field 'styles'. Did you mean 'style'?",
				})
			})

			it('rejects likely typo: outputs instead of output', () => {
				const input = `---
outputs: ./dist/resume
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "Unknown frontmatter field 'outputs'. Did you mean 'output'?",
				})
			})

			it('rejects genuinely unknown fields (not typos) with extra suggestion', () => {
				const input = `---
themes: formal
variables: some-value
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error:
						"Unknown frontmatter field 'variables'. Use 'extra' for custom fields.",
				})
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
				assert(result.ok)

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
				assert(result.ok)

				expect(result.config?.pages).toBe(1)
				expect(result.warnings).toEqual([])
			})

			it('parses pages: 2 from YAML', () => {
				const input = `---
pages: 2
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.pages).toBe(2)
			})

			it('parses pages from TOML', () => {
				const input = `+++
pages = 1
+++
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

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
				assert(result.ok)

				expect(result.config).toEqual({
					themes: ['zurich'],
					pages: 1,
					style: { 'font-size': '10pt' },
				})
			})

			it('rejects pages: 0', () => {
				const input = `---
pages: 0
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "'pages' must be a positive integer (>= 1)",
				})
			})

			it('rejects negative pages', () => {
				const input = `---
pages: -1
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "'pages' must be a positive integer (>= 1)",
				})
			})

			it('rejects non-integer pages', () => {
				const input = `---
pages: 1.5
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "'pages' must be a positive integer (>= 1)",
				})
			})

			it('rejects non-number pages', () => {
				const input = `---
pages: "one"
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result).toEqual({
					ok: false,
					error: "'pages' must be a positive integer (>= 1)",
				})
			})
		})

		describe('roles field', () => {
			it('parses roles as a map of string arrays', () => {
				const input = `---
roles:
  fullstack:
    - frontend
    - backend
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.roles).toEqual({
					fullstack: ['frontend', 'backend'],
				})
			})

			it('coerces a single string value to a one-element array', () => {
				const input = `---
roles:
  senior: backend
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.roles).toEqual({
					senior: ['backend'],
				})
			})

			it('parses multiple composed roles', () => {
				const input = `---
roles:
  fullstack: [frontend, backend]
  tech-lead: [backend, leadership]
  startup-cto: [fullstack, leadership, architecture]
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.roles).toEqual({
					fullstack: ['frontend', 'backend'],
					'tech-lead': ['backend', 'leadership'],
					'startup-cto': ['fullstack', 'leadership', 'architecture'],
				})
			})

			it('is optional', () => {
				const input = `---
themes: zurich
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.roles).toBeUndefined()
			})

			it('rejects non-string array values', () => {
				const input = `---
roles:
  fullstack:
    - 123
---
# Resume`

				const result = parseFrontmatterFromString(input)

				expect(result.ok).toBe(false)
			})

			it('parses roles from TOML', () => {
				const input = `+++
[roles]
fullstack = ["frontend", "backend"]
+++
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.roles).toEqual({
					fullstack: ['frontend', 'backend'],
				})
			})

			it('works alongside other frontmatter fields', () => {
				const input = `---
themes: zurich
pages: 1
roles:
  fullstack: [frontend, backend]
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config).toEqual({
					themes: ['zurich'],
					pages: 1,
					roles: { fullstack: ['frontend', 'backend'] },
				})
			})
		})

		describe('extra field', () => {
			it('parses extra with arbitrary key/value pairs', () => {
				const input = `---
themes: zurich
extra:
  name: Adrian Sterling
  target-role: Senior SWE
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.extra).toEqual({
					name: 'Adrian Sterling',
					'target-role': 'Senior SWE',
				})
			})

			it('parses extra with nested objects', () => {
				const input = `---
extra:
  contact:
    email: test@example.com
    phone: "555-1234"
  tags:
    - typescript
    - react
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.extra).toEqual({
					contact: { email: 'test@example.com', phone: '555-1234' },
					tags: ['typescript', 'react'],
				})
			})

			it('parses extra alongside other known fields', () => {
				const input = `---
themes: zurich
pages: 1
style:
  font-size: 10pt
extra:
  company: Acme Corp
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config).toEqual({
					themes: ['zurich'],
					pages: 1,
					style: { 'font-size': '10pt' },
					extra: { company: 'Acme Corp' },
				})
			})

			it('is optional', () => {
				const input = `---
themes: zurich
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.extra).toBeUndefined()
			})
		})

		describe('edge cases', () => {
			it('handles frontmatter with empty values', () => {
				const input = `---
themes: ""
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.themes).toEqual([''])
			})

			it('handles frontmatter with whitespace in values', () => {
				const input = `---
output: "my resume file"
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

				expect(result.config?.output).toBe('my resume file')
			})

			it('handles frontmatter with special characters in style', () => {
				const input = `---
style:
  font-family: "Arial, 'Helvetica Neue', sans-serif"
---
# Resume`

				const result = parseFrontmatterFromString(input)
				assert(result.ok)

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
			assert(result.ok)

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
			assert(result.ok)

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
			assert(result.ok)

			expect(result.config).toBeNull()
			expect(result.content).toBe(content)
		})

		it('throws on file read error', () => {
			const filePath = join(tempDir, 'nonexistent.md')

			expect(() => parseFrontmatter(filePath)).toThrow()
		})
	})
})
