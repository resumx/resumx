import { describe, it, expect } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { parseHTML } from 'linkedom'
import { generateHtml, processColumns } from './html-generator.js'

// =============================================================================
// Test Utilities
// =============================================================================

type VirtualFileMap = Record<string, string>

/**
 * Parse HTML string into a DOM for structural assertions
 * Uses linkedom (same parser as production code) for consistency
 * Returns a wrapper element containing the parsed content
 */
function parseHtml(html: string): {
	body: Element
	querySelector: (selector: string) => Element | null
	querySelectorAll: (selector: string) => NodeListOf<Element>
} {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!
	return {
		body: root,
		querySelector: (selector: string) => root.querySelector(selector),
		querySelectorAll: (selector: string) => root.querySelectorAll(selector),
	}
}

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

		it('includes Iconify script', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml('# Test', {
					cssPath: join(dir, 'style.css'),
				})

				expect(html).toContain('iconify.min.js')
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

		it('processes expressions when context provided', async () => {
			await withTempDir(async dir => {
				writeVirtualFiles(dir, { 'style.css': SIMPLE_CSS })

				const html = await generateHtml('# {{ name }}\n\nYear: {{ year }}', {
					cssPath: join(dir, 'style.css'),
					expressionContext: {
						name: 'Dynamic Title',
						year: 2026,
					},
				})

				expect(html).toContain('<h1>Dynamic Title</h1>')
				expect(html).toContain('Year: 2026')
			})
		})

		it('leaves expressions unchanged when no context', async () => {
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

				expect(html).toContain('<h1>Resume</h1>')
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
	})

	describe('processColumns', () => {
		const CSS_WITH_TWO_COLUMN = `
.two-column-layout {
	display: grid;
	grid-template-columns: 2fr 1fr;
}
`
		const CSS_WITHOUT_TWO_COLUMN = `
body {
	font-family: Arial;
}
`

		describe('header extraction', () => {
			it('extracts content before first h2 into header element', () => {
				const html = '<h1>Name</h1><p>Contact</p><h2>Experience</h2><p>Job</p>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				// Check header exists and contains correct elements
				const header = doc.querySelector('header')
				expect(header).toBeTruthy()
				expect(header?.querySelector('h1')?.textContent).toBe('Name')
				expect(header?.querySelector('p')?.textContent).toBe('Contact')

				// Check sequence: header comes before h2
				const body = doc.body
				const headerIndex = Array.from(body.children).indexOf(header!)
				const h2 = doc.querySelector('h2')
				const h2Index = Array.from(body.children).indexOf(h2!)
				expect(headerIndex).toBeLessThan(h2Index)
			})

			it('does not create header when h2 is first element', () => {
				const html = '<h2>Experience</h2><p>Job</p>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				expect(doc.querySelector('header')).toBeNull()
			})

			it('does not create header when no h2 exists', () => {
				const html = '<h1>Title</h1><p>Content</p>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				expect(doc.querySelector('header')).toBeNull()
				expect(result).toBe(html)
			})

			it('extracts header in single-column mode (no hr)', () => {
				const html = '<h1>Name</h1><h2>Experience</h2><p>Job</p>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				const header = doc.querySelector('header')
				expect(header).toBeTruthy()
				expect(header?.querySelector('h1')?.textContent).toBe('Name')
				expect(doc.querySelector('h2')?.textContent).toBe('Experience')
			})

			it('extracts header when style does not support two-column', () => {
				const html = '<h1>Name</h1><h2>Experience</h2><hr><h2>Skills</h2>'
				const result = processColumns(html, CSS_WITHOUT_TWO_COLUMN)
				const doc = parseHtml(result)

				const header = doc.querySelector('header')
				expect(header).toBeTruthy()
				expect(header?.querySelector('h1')?.textContent).toBe('Name')

				// Should not have hr tags (stripped)
				expect(doc.querySelector('hr')).toBeNull()
				// Should not have two-column layout
				expect(doc.querySelector('.two-column-layout')).toBeNull()
			})
		})

		describe('two-column layout', () => {
			it('wraps in two-column layout when style supports it', () => {
				const html = '<h1>Name</h1><h2>Experience</h2><hr><h2>Skills</h2>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				// Check two-column wrapper exists
				const layout = doc.querySelector('.two-column-layout')
				expect(layout).toBeTruthy()

				// Check header exists inside layout
				const header = layout?.querySelector('header')
				expect(header?.querySelector('h1')?.textContent).toBe('Name')

				// Check primary and secondary columns
				const primary = layout?.querySelector('.primary')
				const secondary = layout?.querySelector('.secondary')
				expect(primary).toBeTruthy()
				expect(secondary).toBeTruthy()

				// Check content distribution
				expect(primary?.querySelector('h2')?.textContent).toBe('Experience')
				expect(secondary?.querySelector('h2')?.textContent).toBe('Skills')

				// No hr should remain
				expect(doc.querySelector('hr')).toBeNull()
			})

			it('places header inside two-column-layout div', () => {
				const html = '<h1>Name</h1><h2>Experience</h2><hr><h2>Skills</h2>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				const layout = doc.querySelector('.two-column-layout')
				const header = doc.querySelector('header')

				// Header should be child of layout
				expect(header?.parentElement).toBe(layout)
			})

			it('strips <hr> and concatenates when style does not support two-column', () => {
				const html = '<h2>Experience</h2><hr><h2>Skills</h2>'
				const result = processColumns(html, CSS_WITHOUT_TWO_COLUMN)
				const doc = parseHtml(result)

				// No two-column layout
				expect(doc.querySelector('.two-column-layout')).toBeNull()

				// No hr tags
				expect(doc.querySelector('hr')).toBeNull()

				// Both h2s present
				const h2s = doc.querySelectorAll('h2')
				expect(h2s.length).toBe(2)
				expect(h2s[0].textContent).toBe('Experience')
				expect(h2s[1].textContent).toBe('Skills')
			})

			it('splits at first <hr> and removes all others', () => {
				const html = '<h2>Exp</h2><hr><h2>Skills</h2><hr><h2>Other</h2>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				// Check layout exists
				const layout = doc.querySelector('.two-column-layout')
				expect(layout).toBeTruthy()

				// Check primary has first h2
				const primary = layout?.querySelector('.primary')
				expect(primary?.querySelector('h2')?.textContent).toBe('Exp')

				// Check secondary has both other h2s
				const secondary = layout?.querySelector('.secondary')
				const secondaryH2s = secondary?.querySelectorAll('h2')
				expect(secondaryH2s?.length).toBe(2)
				expect(secondaryH2s?.[0].textContent).toBe('Skills')
				expect(secondaryH2s?.[1].textContent).toBe('Other')

				// No hr should remain
				expect(doc.querySelector('hr')).toBeNull()
			})

			it('handles <hr /> self-closing syntax', () => {
				const html = '<h2>Exp</h2><hr /><h2>Skills</h2>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				expect(doc.querySelector('.two-column-layout')).toBeTruthy()
				expect(doc.querySelector('hr')).toBeNull()
			})

			it('handles <hr/> self-closing syntax without space', () => {
				const html = '<h2>Exp</h2><hr/><h2>Skills</h2>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				expect(doc.querySelector('.two-column-layout')).toBeTruthy()
				expect(doc.querySelector('hr')).toBeNull()
			})

			it('handles empty primary column', () => {
				const html = '<hr><h2>Only secondary</h2>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				const layout = doc.querySelector('.two-column-layout')
				const primary = layout?.querySelector('.primary')
				const secondary = layout?.querySelector('.secondary')

				expect(primary).toBeTruthy()
				expect(primary?.textContent?.trim()).toBe('')
				expect(secondary?.querySelector('h2')?.textContent).toBe(
					'Only secondary',
				)
			})

			it('handles empty secondary column', () => {
				const html = '<h2>Only primary</h2><hr>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				const layout = doc.querySelector('.two-column-layout')
				const primary = layout?.querySelector('.primary')
				const secondary = layout?.querySelector('.secondary')

				expect(primary?.querySelector('h2')?.textContent).toBe('Only primary')
				expect(secondary).toBeTruthy()
				expect(secondary?.textContent?.trim()).toBe('')
			})

			it('is case-insensitive for hr tags', () => {
				const html = '<h2>Exp</h2><HR><h2>Skills</h2>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				expect(doc.querySelector('.two-column-layout')).toBeTruthy()
				expect(doc.querySelector('hr')).toBeNull()
			})

			it('detects .two-column-layout with various whitespace', () => {
				const cssVariants = [
					'.two-column-layout{display:grid}',
					'.two-column-layout { display: grid }',
					'.two-column-layout\n{\n\tdisplay: grid;\n}',
				]

				const html = '<h2>Exp</h2><hr><h2>Skills</h2>'

				for (const css of cssVariants) {
					const result = processColumns(html, css)
					const doc = parseHtml(result)
					expect(doc.querySelector('.two-column-layout')).toBeTruthy()
				}
			})
		})

		describe('no hr present', () => {
			it('returns unchanged when no h2 and no hr', () => {
				const html = '<h1>Title</h1><p>Content</p>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)

				expect(result).toBe('<h1>Title</h1><p>Content</p>')
			})

			it('extracts header but no two-column when only h2 present (no hr)', () => {
				const html = '<h1>Name</h1><h2>Section</h2><p>Content</p>'
				const result = processColumns(html, CSS_WITH_TWO_COLUMN)
				const doc = parseHtml(result)

				// Should have header
				const header = doc.querySelector('header')
				expect(header).toBeTruthy()
				expect(header?.querySelector('h1')?.textContent).toBe('Name')

				// Should have h2 after header
				expect(doc.querySelector('h2')?.textContent).toBe('Section')

				// Should NOT have two-column layout
				expect(doc.querySelector('.two-column-layout')).toBeNull()
			})
		})
	})
})
