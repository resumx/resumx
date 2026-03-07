import { describe, it, expect, vi, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateHtml, resolveCSS } from './html-generator.js'
import type { DocumentContext } from './types.js'
import type { ResolvedView } from './view/types.js'
import type { SectionsConfig } from './view/types.js'

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

interface LegacyOptions {
	cssPaths: string[]
	variables?: Record<string, string>
	activeTag?: string
	activeLang?: string
	tagMap?: Record<string, string[]>
	sections?: SectionsConfig
	icons?: Record<string, string>
	vars?: Record<string, string>
}

function gen(content: string, opts: LegacyOptions): Promise<string> {
	const doc: DocumentContext = {
		content,
		icons: opts.icons,
		tagMap: opts.tagMap,
		baseDir: '',
	}
	const view: ResolvedView = {
		selects: opts.activeTag ? [opts.activeTag] : null,
		sections: {
			hide: opts.sections?.hide ?? [],
			pin: opts.sections?.pin ?? [],
		},
		pages: null,
		bulletOrder: 'none',
		vars: opts.vars ?? {},
		style: opts.variables ?? {},
		format: 'pdf',
		output: null,
		css: opts.cssPaths,
		lang: opts.activeLang ?? null,
	}
	return generateHtml(doc, view)
}

// =============================================================================
// Tests
// =============================================================================

describe('html-generator', () => {
	describe('generateHtml', () => {
		it('generates valid HTML document structure', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await gen('# Test', {
					cssPaths: [join(dir, 'style.css')],
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

				const html = await gen('# Test', {
					cssPaths: [join(dir, 'style.css')],
				})

				expect(html).toContain('<meta charset="UTF-8">')
			})
		})

		it('includes viewport meta', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await gen('# Test', {
					cssPaths: [join(dir, 'style.css')],
				})

				expect(html).toContain(
					'<meta name="viewport" content="width=device-width, initial-scale=1.0">',
				)
			})
		})
		it('embeds CSS in style tag', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await gen('# Test', {
					cssPaths: [join(dir, 'style.css')],
				})

				expect(html).toContain('<style>')
				expect(html).toContain('--font-family: Arial')
				expect(html).toContain('</style>')
			})
		})

		it('renders markdown content to body', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await gen('# Hello World\n\nParagraph here.', {
					cssPaths: [join(dir, 'style.css')],
				})

				expect(html).toContain('<h1>Hello World</h1>')
				expect(html).toContain('<p>Paragraph here.</p>')
			})
		})

		it('applies CSS variable overrides', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await gen('# Test', {
					cssPaths: [join(dir, 'style.css')],
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

				const html = await gen('# Test', {
					cssPaths: [join(dir, 'style.css')],
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

		it('replaces undefined variables with empty string', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await gen('# Hello {{ name }}', {
					cssPaths: [join(dir, 'style.css')],
				})

				expect(html).toContain('Hello')
				expect(html).not.toContain('{{ name }}')
			})
		})

		it('compiles Tailwind CSS for utility classes', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await gen(
					'<div class="text-blue-500 font-bold">Styled</div>',
					{ cssPaths: [join(dir, 'style.css')] },
				)

				expect(html).toContain('.text-blue-500')
				expect(html).toContain('.font-bold')
			})
		})

		it('handles empty content', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await gen('', {
					cssPaths: [join(dir, 'style.css')],
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
				const html = await gen(markdown, {
					cssPaths: [join(dir, 'style.css')],
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

		describe('frontmatter icons', () => {
			afterEach(() => {
				vi.restoreAllMocks()
			})

			it('renders inline SVG icon with normalized dimensions', async () => {
				await withTempDir(async dir => {
					writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

					const html = await gen('### :myicon: Company', {
						cssPaths: [join(dir, 'style.css')],
						icons: {
							myicon:
								'<svg xmlns="http://www.w3.org/2000/svg" width="384" height="512" viewBox="0 0 384 512"><path d="M0 0"/></svg>',
						},
					})

					expect(html).toContain('<span class="icon">')
					expect(html).toContain('<path d="M0 0"')
					expect(html).not.toContain('width="384"')
					expect(html).not.toContain('height="512"')
				})
			})

			it('renders URL icon as fetched data URI img', async () => {
				const svgContent =
					'<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>'
				vi.stubGlobal(
					'fetch',
					vi.fn().mockResolvedValue({
						ok: true,
						headers: { get: () => 'image/svg+xml' },
						arrayBuffer: () =>
							Promise.resolve(new TextEncoder().encode(svgContent).buffer),
					}),
				)

				await withTempDir(async dir => {
					writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

					const html = await gen('### :logo: Company', {
						cssPaths: [join(dir, 'style.css')],
						icons: {
							logo: 'https://example.com/logo.svg',
						},
					})

					expect(html).toContain('<img')
					expect(html).toContain('data:image/svg+xml;base64,')
					expect(html).toContain('class="icon"')
					// Should NOT contain the raw external URL
					expect(html).not.toContain('src="https://example.com/logo.svg"')
				})
			})

			it('renders base64 data URI icon as img', async () => {
				await withTempDir(async dir => {
					writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

					const svgB64 = Buffer.from(
						'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle r="10"/></svg>',
					).toString('base64')

					const html = await gen('### :badge: Award', {
						cssPaths: [join(dir, 'style.css')],
						icons: {
							badge: `data:image/svg+xml;base64,${svgB64}`,
						},
					})

					expect(html).toContain('<img')
					expect(html).toContain(`data:image/svg+xml;base64,${svgB64}`)
					expect(html).toContain('class="icon"')
				})
			})

			it('frontmatter icon overrides built-in asset icon', async () => {
				await withTempDir(async dir => {
					writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

					const html = await gen(':react:', {
						cssPaths: [join(dir, 'style.css')],
						icons: {
							react:
								'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect class="custom-react"/></svg>',
						},
					})

					// Should use the frontmatter override, not the bundled asset
					expect(html).toContain('custom-react')
				})
			})

			it('icons are cleared between renders', async () => {
				await withTempDir(async dir => {
					writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

					// First render with icons
					await gen(':myicon:', {
						cssPaths: [join(dir, 'style.css')],
						icons: {
							myicon:
								'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle/></svg>',
						},
					})

					const html2 = await gen(':myicon:', {
						cssPaths: [join(dir, 'style.css')],
					})

					expect(html2).toContain(':myicon:')
				})
			})
		})

		it('throws error for non-existent CSS file', async () => {
			await expect(
				gen('# Test', {
					cssPaths: ['/non/existent/style.css'],
				}),
			).rejects.toThrow('not found')
		})

		it('renders inline CSS in a separate style tag', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const inlineCSS = 'h2 { color: red; }'
				const html = await gen('# Test\n\n## Section', {
					cssPaths: [join(dir, 'style.css'), inlineCSS],
				})

				const styleTags = html.match(/<style>/g)
				expect(styleTags?.length).toBe(2)
				expect(html).toContain('h2 { color: red; }')
			})
		})

		it('renders each inline CSS entry in its own style tag', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await gen('# Test', {
					cssPaths: [
						join(dir, 'style.css'),
						'h2 { color: red; }',
						'h3 { color: blue; }',
					],
				})

				const styleTags = html.match(/<style>/g)
				expect(styleTags?.length).toBe(3)
				expect(html).toContain('h2 { color: red; }')
				expect(html).toContain('h3 { color: blue; }')
			})
		})

		it('inline CSS appears after base CSS', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const inlineCSS = 'h2 { letter-spacing: 0.05em; }'
				const html = await gen('# Test', {
					cssPaths: [join(dir, 'style.css'), inlineCSS],
				})

				const basePos = html.indexOf('--font-family: Arial')
				const inlinePos = html.indexOf('letter-spacing: 0.05em')
				expect(basePos).toBeGreaterThan(-1)
				expect(inlinePos).toBeGreaterThan(-1)
				expect(inlinePos).toBeGreaterThan(basePos)
			})
		})

		describe('activeTag filtering', () => {
			it('filters content to keep only matching tag', async () => {
				await withTempDir(async dir => {
					writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

					const markdown = `
# Resume

- Frontend skill {.@frontend}
- Backend skill {.@backend}
- Common skill
`
					const html = await gen(markdown, {
						cssPaths: [join(dir, 'style.css')],
						activeTag: 'frontend',
					})

					expect(html).toContain('Frontend skill')
					expect(html).not.toContain('Backend skill')
					expect(html).toContain('Common skill')
				})
			})

			it('keeps all content when no active tag specified', async () => {
				await withTempDir(async dir => {
					writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

					const markdown = `
- Frontend skill {.@frontend}
- Backend skill {.@backend}
`
					const html = await gen(markdown, {
						cssPaths: [join(dir, 'style.css')],
					})

					expect(html).toContain('Frontend skill')
					expect(html).toContain('Backend skill')
				})
			})

			it('filters fenced div content by tag', async () => {
				await withTempDir(async dir => {
					writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

					const markdown = `
# Skills

::: div {.@frontend}
- React
- TypeScript
:::

::: div {.@backend}
- Node.js
- PostgreSQL
:::
`
					const html = await gen(markdown, {
						cssPaths: [join(dir, 'style.css')],
						activeTag: 'backend',
					})

					expect(html).not.toContain('React')
					expect(html).not.toContain('TypeScript')
					expect(html).toContain('Node.js')
					expect(html).toContain('PostgreSQL')
				})
			})
		})
	})

	describe('resolveCSS', () => {
		it('returns default stylesheet when css is null', () => {
			const result = resolveCSS(null, '/tmp')
			expect(result.paths.length).toBe(1)
			expect(result.inline).toEqual([])
		})

		it('returns default stylesheet when css is empty', () => {
			const result = resolveCSS([], '/tmp')
			expect(result.paths.length).toBe(1)
			expect(result.inline).toEqual([])
		})

		it('treats entries ending with .css as file paths', () => {
			withTempDir(async dir => {
				writeVirtualFiles(dir, { 'theme.css': 'body {}' })
				const result = resolveCSS([join(dir, 'theme.css')], dir)
				expect(result.paths.length).toBe(2)
				expect(result.inline).toEqual([])
			})
		})

		it('treats entries not ending with .css as inline CSS', () => {
			const result = resolveCSS(['h2 { color: red; }'], '/tmp')
			expect(result.paths.length).toBe(1)
			expect(result.inline).toEqual(['h2 { color: red; }'])
		})

		it('splits mixed file paths and inline CSS', () => {
			withTempDir(async dir => {
				writeVirtualFiles(dir, { 'base.css': 'body {}' })
				const result = resolveCSS(
					[join(dir, 'base.css'), 'h2 { color: red; }'],
					dir,
				)
				expect(result.paths.length).toBe(2)
				expect(result.inline).toEqual(['h2 { color: red; }'])
			})
		})

		it('throws for non-existent .css file', () => {
			expect(() => resolveCSS(['/no/such/file.css'], '/tmp')).toThrow(
				'CSS file not found',
			)
		})

		it.each(['.less', '.sass', '.scss', '.styl'])(
			'throws for preprocessor extension %s',
			ext => {
				expect(() => resolveCSS([`theme${ext}`], '/tmp')).toThrow(
					'not supported',
				)
			},
		)

		it('handles multiline inline CSS from YAML block scalar', () => {
			const blockCSS = `h2 {
  display: flex;
  align-items: center;
  gap: 8px;
}

h2::after {
  content: '';
  flex: 1;
}`
			const result = resolveCSS([blockCSS], '/tmp')
			expect(result.paths.length).toBe(1)
			expect(result.inline).toEqual([blockCSS])
		})
	})
})
