import { describe, it, expect } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateHtml } from './html-generator.js'

// =============================================================================
// Test Utilities
// =============================================================================

type VirtualFileMap = Record<string, string>

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
	const dir = mkdtempSync(join(tmpdir(), 'html-gen-test-'))
	try {
		return await fn(dir)
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
}

function writeVirtualFiles(baseDir: string, files: VirtualFileMap): void {
	for (const [relativePath, content] of Object.entries(files)) {
		const absolutePath = join(baseDir, relativePath)
		mkdirSync(dirname(absolutePath), { recursive: true })
		writeFileSync(absolutePath, content, 'utf-8')
	}
}

const SIMPLE_CSS = `
:root {
	--font-family: Arial, sans-serif;
}
body {
	font-family: var(--font-family);
}
`

// =============================================================================
// Tests
// =============================================================================

describe('html-generator', () => {
	describe('generateHtml', () => {
		it('generates valid HTML document structure', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml('# Test', {
					cssPath: join(dir, 'style.css'),
				})

				expect(html).toContain('<!DOCTYPE html>')
				expect(html).toContain('<html lang="en">')
				expect(html).toContain('<head>')
				expect(html).toContain('<body>')
				expect(html).toContain('</html>')
			})
		})

		it('includes meta charset', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml('# Test', {
					cssPath: join(dir, 'style.css'),
				})

				expect(html).toContain('<meta charset="UTF-8">')
			})
		})

		it('includes viewport meta', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml('# Test', {
					cssPath: join(dir, 'style.css'),
				})

				expect(html).toContain(
					'<meta name="viewport" content="width=device-width, initial-scale=1.0">',
				)
			})
		})
		it('embeds CSS in style tag', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml('# Test', {
					cssPath: join(dir, 'style.css'),
				})

				expect(html).toContain('<style>')
				expect(html).toContain('--font-family: Arial')
				expect(html).toContain('</style>')
			})
		})

		it('renders markdown content to body', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml('# Hello World\n\nParagraph here.', {
					cssPath: join(dir, 'style.css'),
				})

				expect(html).toContain('<h1>Hello World</h1>')
				expect(html).toContain('<p>Paragraph here.</p>')
			})
		})

		it('applies CSS variable overrides', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml('# Test', {
					cssPath: join(dir, 'style.css'),
					variables: {
						'font-family': 'CustomFont, serif',
						'custom-color': '#ff0000',
					},
				})

				expect(html).toContain('--font-family: CustomFont, serif')
				expect(html).toContain('--custom-color: #ff0000')
			})
		})

		it('variable overrides come after base CSS', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml('# Test', {
					cssPath: join(dir, 'style.css'),
					variables: {
						'font-family': 'Override',
					},
				})

				// Find positions of both declarations
				const baseCssPos = html.indexOf('--font-family: Arial')
				const overridePos = html.indexOf('--font-family: Override')

				// Override should come after base
				expect(baseCssPos).toBeGreaterThan(-1)
				expect(overridePos).toBeGreaterThan(-1)
				expect(overridePos).toBeGreaterThan(baseCssPos)
			})
		})

		it('leaves double-brace syntax unchanged', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml('# {{ name }}', {
					cssPath: join(dir, 'style.css'),
				})

				// Without context, expression is left as-is
				expect(html).toContain('{{ name }}')
			})
		})

		it('compiles Tailwind CSS for utility classes', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml(
					'<div class="text-blue-500 font-bold">Styled</div>',
					{ cssPath: join(dir, 'style.css') },
				)

				expect(html).toContain('.text-blue-500')
				expect(html).toContain('.font-bold')
			})
		})

		it('handles empty content', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml('', {
					cssPath: join(dir, 'style.css'),
				})

				expect(html).toContain('<!DOCTYPE html>')
				expect(html).toContain('<body>')
			})
		})

		it('handles complex markdown', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const markdown = `
# Resume

## Experience

### Company Name [2020 - Present]{.right}

_Software Engineer_

- Built things with \`TypeScript\`
- Led team of 5

## Skills

Languages
: TypeScript, Python, Go
`
				const html = await generateHtml(markdown, {
					cssPath: join(dir, 'style.css'),
				})

				expect(html).toContain('Resume</h1>')
				expect(html).toContain('<h2>Experience</h2>')
				expect(html).toContain('<h3>Company Name')
				expect(html).toContain('class="right"')
				expect(html).toContain('<em>Software Engineer</em>')
				expect(html).toContain('<code>TypeScript</code>')
				expect(html).toContain('<dl>')
				expect(html).toContain('<dt>Languages</dt>')
			})
		})

		it('throws error for non-existent CSS file', async () => {
			await expect(
				generateHtml('# Test', {
					cssPath: '/non/existent/style.css',
				}),
			).rejects.toThrow('not found')
		})

		describe('activeRole filtering', () => {
			it('filters content to keep only matching role', async () => {
				await withTempDir(async dir => {
					writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

					const markdown = `
# Resume

- Frontend skill {.role:frontend}
- Backend skill {.role:backend}
- Common skill
`
					const html = await generateHtml(markdown, {
						cssPath: join(dir, 'style.css'),
						activeRole: 'frontend',
					})

					expect(html).toContain('Frontend skill')
					expect(html).not.toContain('Backend skill')
					expect(html).toContain('Common skill')
				})
			})

			it('keeps all content when no activeRole specified', async () => {
				await withTempDir(async dir => {
					writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

					const markdown = `
- Frontend skill {.role:frontend}
- Backend skill {.role:backend}
`
					const html = await generateHtml(markdown, {
						cssPath: join(dir, 'style.css'),
					})

					expect(html).toContain('Frontend skill')
					expect(html).toContain('Backend skill')
				})
			})

			it('filters fenced div content by role', async () => {
				await withTempDir(async dir => {
					writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

					const markdown = `
# Skills

::: {.role:frontend}
- React
- TypeScript
:::

::: {.role:backend}
- Node.js
- PostgreSQL
:::
`
					const html = await generateHtml(markdown, {
						cssPath: join(dir, 'style.css'),
						activeRole: 'backend',
					})

					expect(html).not.toContain('React')
					expect(html).not.toContain('TypeScript')
					expect(html).toContain('Node.js')
					expect(html).toContain('PostgreSQL')
				})
			})
		})
	})
})
