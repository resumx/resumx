import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	mkdtempSync,
	mkdirSync,
	rmSync,
	writeFileSync,
	existsSync,
	readFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { browserPool } from './browser-pool.js'

// Get project paths
const __dirname = dirname(fileURLToPath(import.meta.url))
const THEMES_DIR = join(__dirname, '../../themes')

// =============================================================================
// Test Utilities
// =============================================================================

type VirtualFileMap = Record<string, string>

function withTempDir<T>(fn: (dir: string) => T): T {
	const dir = mkdtempSync(join(tmpdir(), 'renderer-test-'))
	try {
		return fn(dir)
	} finally {
		rmSync(dir, { recursive: true, force: true })
	}
}

async function withTempDirAsync<T>(
	fn: (dir: string) => Promise<T>,
): Promise<T> {
	const dir = mkdtempSync(join(tmpdir(), 'renderer-test-'))
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

// Simple CSS for testing (no imports to avoid resolution issues)
const SIMPLE_CSS = `
:root {
	--font-family: Arial, sans-serif;
	--font-size: 12pt;
}
body {
	font-family: var(--font-family);
	font-size: var(--font-size);
}
h1 { color: black; }
`

// =============================================================================
// Tests
// =============================================================================

describe('renderer', () => {
	// Import once at top level to avoid MaxListeners warning from repeated module loads
	let render: typeof import('./renderer.js').render
	let renderMultiple: typeof import('./renderer.js').renderMultiple
	let extractNameFromMarkdown: typeof import('./renderer.js').extractNameFromMarkdown
	let getOutputName: typeof import('./renderer.js').getOutputName
	let moduleLoaded = false

	beforeEach(async () => {
		if (!moduleLoaded) {
			const module = await import('./renderer.js')
			render = module.render
			renderMultiple = module.renderMultiple
			extractNameFromMarkdown = module.extractNameFromMarkdown
			getOutputName = module.getOutputName
			moduleLoaded = true
		}
	})

	afterEach(async () => {
		vi.restoreAllMocks()
	})

	// =========================================================================
	// Utility Functions
	// =========================================================================

	describe('getOutputName', () => {
		it('returns basename without .md extension', () => {
			expect(getOutputName('/path/to/resume.md')).toBe('resume')
		})

		it('returns basename for simple filename', () => {
			expect(getOutputName('myfile.md')).toBe('myfile')
		})

		it('handles paths with multiple dots', () => {
			expect(getOutputName('/path/to/my.resume.md')).toBe('my.resume')
		})

		it('handles relative paths', () => {
			expect(getOutputName('./docs/cv.md')).toBe('cv')
		})

		it('handles paths without extension', () => {
			expect(getOutputName('/path/to/file')).toBe('file')
		})

		it('handles paths with no directory', () => {
			expect(getOutputName('resume.md')).toBe('resume')
		})
	})

	describe('extractNameFromMarkdown', () => {
		it('extracts name from H1 heading', () => {
			withTempDir(dir => {
				const mdContent = '# John Doe\n\nSome content'
				writeVirtualFiles(dir, { 'resume.md': mdContent })

				const result = extractNameFromMarkdown(join(dir, 'resume.md'))
				expect(result).toBe('JohnDoe')
			})
		})

		it('converts name to PascalCase', () => {
			withTempDir(dir => {
				const mdContent = '# jane smith\n\nSome content'
				writeVirtualFiles(dir, { 'resume.md': mdContent })

				const result = extractNameFromMarkdown(join(dir, 'resume.md'))
				expect(result).toBe('JaneSmith')
			})
		})

		it('handles multiple words in heading', () => {
			withTempDir(dir => {
				const mdContent = '# JOHN MICHAEL DOE\n\nContent here'
				writeVirtualFiles(dir, { 'resume.md': mdContent })

				const result = extractNameFromMarkdown(join(dir, 'resume.md'))
				expect(result).toBe('JohnMichaelDoe')
			})
		})

		it('returns undefined for missing H1', () => {
			withTempDir(dir => {
				const mdContent = '## Section Header\n\nNo H1 here'
				writeVirtualFiles(dir, { 'resume.md': mdContent })

				const result = extractNameFromMarkdown(join(dir, 'resume.md'))
				expect(result).toBeUndefined()
			})
		})

		it('returns undefined for empty file', () => {
			withTempDir(dir => {
				writeVirtualFiles(dir, { 'empty.md': '' })

				const result = extractNameFromMarkdown(join(dir, 'empty.md'))
				expect(result).toBeUndefined()
			})
		})

		it('returns undefined for non-existent file', () => {
			const result = extractNameFromMarkdown('/non/existent/file.md')
			expect(result).toBeUndefined()
		})

		it('handles H1 with extra whitespace', () => {
			withTempDir(dir => {
				const mdContent = '#   Alice   Bob  \n\nContent'
				writeVirtualFiles(dir, { 'resume.md': mdContent })

				const result = extractNameFromMarkdown(join(dir, 'resume.md'))
				expect(result).toBe('AliceBob')
			})
		})

		it('uses first H1 when multiple exist', () => {
			withTempDir(dir => {
				const mdContent = '# First Name\n\n# Second Name\n\nContent'
				writeVirtualFiles(dir, { 'resume.md': mdContent })

				const result = extractNameFromMarkdown(join(dir, 'resume.md'))
				expect(result).toBe('FirstName')
			})
		})

		it('handles H1 not at start of file', () => {
			withTempDir(dir => {
				const mdContent = 'Some intro text\n\n# Jane Doe\n\nContent'
				writeVirtualFiles(dir, { 'resume.md': mdContent })

				const result = extractNameFromMarkdown(join(dir, 'resume.md'))
				expect(result).toBe('JaneDoe')
			})
		})
	})

	// =========================================================================
	// Render Function - HTML Format
	// =========================================================================

	describe('render - HTML format', () => {
		it('generates valid HTML with embedded CSS', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test Person\n\nHello world'
				writeVirtualFiles(dir, {
					'input.md': mdContent,
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
				expect(result.outputPath).toBe(join(dir, 'output.html'))
				expect(existsSync(result.outputPath)).toBe(true)

				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('<!DOCTYPE html>')
				expect(html).toContain('<html lang="en">')
				expect(html).toContain('<h1>Test Person</h1>')
				expect(html).toContain('Hello world')
			})
		})

		it('embeds CSS in style tag', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'input.md': mdContent,
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('<style>')
				expect(html).toContain('--font-family: Arial')
			})
		})

		it('applies variable overrides', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
					variables: {
						'font-family': 'CustomFont, serif',
						'custom-var': '#ff0000',
					},
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('--font-family: CustomFont, serif')
				expect(html).toContain('--custom-var: #ff0000')
			})
		})

		it('processes expressions when context provided', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# {{ name }}\n\nYear: {{ year }}'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
					expressionContext: {
						name: 'Dynamic Name',
						year: 2026,
					},
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('<h1>Dynamic Name</h1>')
				expect(html).toContain('Year: 2026')
			})
		})

		it('creates output directory if it does not exist', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const outputPath = join(dir, 'nested', 'deep', 'output.html')

				const result = await render({
					content: mdContent,
					output: outputPath,
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
				expect(existsSync(outputPath)).toBe(true)
			})
		})

		it('renders markdown features correctly', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = `# Title

## Section

- List item 1
- List item 2

**Bold** and *italic* and \`code\`

[Link](https://example.com)
`
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				// h1 may have data-field="name" attribute from classifyHeader
				expect(html).toMatch(/<h1[^>]*>Title<\/h1>/)
				expect(html).toContain('<h2>Section</h2>')
				expect(html).toContain('<li>List item 1</li>')
				expect(html).toContain('<strong>Bold</strong>')
				expect(html).toContain('<em>italic</em>')
				expect(html).toContain('<code>code</code>')
				expect(html).toContain('href="https://example.com"')
			})
		})

		it('renders definition lists', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = `# Skills

Languages
: TypeScript, Python

Tools
: Git, Docker
`
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('<dl>')
				expect(html).toContain('<dt>Languages</dt>')
				expect(html).toContain('<dd>TypeScript, Python</dd>')
			})
		})

		it('renders bracketed spans with attributes', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Title\n\n[Right aligned]{.right}'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('class="right"')
			})
		})

		it('handles empty variables object', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
					variables: {},
				})

				expect(result.success).toBe(true)
			})
		})

		it('includes Tailwind CSS for utility classes', async () => {
			await withTempDirAsync(async dir => {
				const mdContent =
					'# Test\n\n<div class="text-blue-500 font-bold">Styled</div>'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('.text-blue-500')
				expect(html).toContain('.font-bold')
			})
		})
	})

	// =========================================================================
	// Render Function - PDF Format
	// =========================================================================

	describe('render - PDF format', () => {
		it('generates PDF output file', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test PDF\n\nContent for PDF'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.pdf'),
					format: 'pdf',
					cssPath: join(dir, 'style.css'),
				})

				// May fail if Chromium is not installed
				if (result.success) {
					expect(existsSync(result.outputPath)).toBe(true)
					// Verify it's a PDF (check magic bytes)
					const pdfContent = readFileSync(result.outputPath)
					expect(pdfContent.toString('utf-8', 0, 5)).toBe('%PDF-')
				} else {
					// Expected if Chromium not installed
					expect(result.error).toContain('Chromium')
				}
			})
		})

		it('applies CSS variables to PDF', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test\n\nContent'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.pdf'),
					format: 'pdf',
					cssPath: join(dir, 'style.css'),
					variables: {
						'font-family': 'Helvetica, sans-serif',
					},
				})

				// May fail if Chromium is not installed
				if (result.success) {
					expect(existsSync(result.outputPath)).toBe(true)
				} else {
					expect(result.error).toContain('Chromium')
				}
			})
		})

		it('processes expressions in PDF content', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# {{ title }}'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.pdf'),
					format: 'pdf',
					cssPath: join(dir, 'style.css'),
					expressionContext: {
						title: 'Dynamic PDF Title',
					},
				})

				// May fail if Chromium is not installed
				expect(
					result.success || result.error?.includes('Chromium'),
				).toBeTruthy()
			})
		})

		it('creates nested output directory for PDF', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const outputPath = join(dir, 'build', 'pdfs', 'output.pdf')

				const result = await render({
					content: mdContent,
					output: outputPath,
					format: 'pdf',
					cssPath: join(dir, 'style.css'),
				})

				// May fail if Chromium is not installed
				if (result.success) {
					expect(existsSync(outputPath)).toBe(true)
				} else {
					expect(result.error).toContain('Chromium')
				}
			})
		})

		it('reuses browser instance for multiple renders', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				// First render
				const result1 = await render({
					content: mdContent,
					output: join(dir, 'output1.pdf'),
					format: 'pdf',
					cssPath: join(dir, 'style.css'),
				})

				// Second render (should reuse browser)
				const result2 = await render({
					content: '# Another Test',
					output: join(dir, 'output2.pdf'),
					format: 'pdf',
					cssPath: join(dir, 'style.css'),
				})

				// May fail if Chromium is not installed
				if (result1.success && result2.success) {
					expect(existsSync(join(dir, 'output1.pdf'))).toBe(true)
					expect(existsSync(join(dir, 'output2.pdf'))).toBe(true)
				} else {
					// Both should have same error type
					expect(
						result1.error?.includes('Chromium')
							|| result2.error?.includes('Chromium'),
					).toBeTruthy()
				}
			})
		})
	})

	// =========================================================================
	// Render Function - PNG Format
	// =========================================================================

	describe('render - PNG format', () => {
		it('generates PNG output file', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test PNG\n\nContent for PNG'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.png'),
					format: 'png',
					cssPath: join(dir, 'style.css'),
				})

				// May fail if Chromium is not installed
				if (result.success) {
					expect(existsSync(result.outputPath)).toBe(true)
					// Verify it's a PNG (check magic bytes: 0x89 P N G)
					const pngContent = readFileSync(result.outputPath)
					expect(pngContent[0]).toBe(0x89)
					expect(pngContent.toString('utf-8', 1, 4)).toBe('PNG')
				} else {
					expect(result.error).toContain('Chromium')
				}
			})
		})

		it('creates nested output directory for PNG', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const outputPath = join(dir, 'build', 'images', 'output.png')

				const result = await render({
					content: mdContent,
					output: outputPath,
					format: 'png',
					cssPath: join(dir, 'style.css'),
				})

				// May fail if Chromium is not installed
				if (result.success) {
					expect(existsSync(outputPath)).toBe(true)
				} else {
					expect(result.error).toContain('Chromium')
				}
			})
		})
	})

	// =========================================================================
	// Render Function - DOCX Format
	// =========================================================================

	describe('render - DOCX format', () => {
		it('generates DOCX output file', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test DOCX\n\nContent for DOCX'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.docx'),
					format: 'docx',
					cssPath: join(dir, 'style.css'),
				})

				// DOCX may fail if pdf2docx or Chromium is not installed
				if (result.success) {
					expect(existsSync(result.outputPath)).toBe(true)
					// DOCX files start with PK (zip magic bytes)
					const docxContent = readFileSync(result.outputPath)
					expect(docxContent.toString('utf-8', 0, 2)).toBe('PK')
				} else {
					// Expected error when dependencies not installed
					expect(
						result.error?.includes('pdf2docx')
							|| result.error?.includes('Chromium'),
					).toBeTruthy()
				}
			})
		})

		it('creates intermediate PDF for DOCX conversion', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.docx'),
					format: 'docx',
					cssPath: join(dir, 'style.css'),
				})

				// Temp PDF should be cleaned up (not in output dir)
				const filesInDir = require('fs').readdirSync(dir)
				const pdfFiles = filesInDir.filter((f: string) =>
					f.startsWith('resum8-'),
				)
				expect(pdfFiles.length).toBe(0)

				// Either success or dependency error
				expect(
					result.success
						|| result.error?.includes('pdf2docx')
						|| result.error?.includes('Chromium'),
				).toBeTruthy()
			})
		})
	})

	// =========================================================================
	// Render Function - Error Handling
	// =========================================================================

	describe('render - error handling', () => {
		it('returns error for non-existent CSS file', async () => {
			await withTempDirAsync(async dir => {
				const result = await render({
					content: '# Test',
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: '/non/existent/style.css',
				})

				expect(result.success).toBe(false)
				expect(result.error).toContain('not found')
			})
		})

		it('handles render errors gracefully', async () => {
			await withTempDirAsync(async dir => {
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				// Try to write to invalid path (read-only or doesn't exist parent)
				const result = await render({
					content: '# Test',
					output: '/root/protected/output.html',
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(false)
				expect(result.error).toBeDefined()
			})
		})

		it('includes output path in error result', async () => {
			await withTempDirAsync(async dir => {
				const outputPath = join(dir, 'output.html')

				const result = await render({
					content: '# Test',
					output: outputPath,
					format: 'html',
					cssPath: '/invalid/path.css',
				})

				expect(result.success).toBe(false)
				expect(result.outputPath).toBe(outputPath)
			})
		})
	})

	// =========================================================================
	// renderMultiple Function
	// =========================================================================

	describe('renderMultiple', () => {
		it('renders single format', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const results = await renderMultiple({
					content: mdContent,
					outputDir: dir,
					outputName: 'output',
					formats: ['html'],
					cssPath: join(dir, 'style.css'),
				})

				expect(results.size).toBe(1)
				expect(results.get('html')?.success).toBe(true)
				expect(existsSync(join(dir, 'output.html'))).toBe(true)
			})
		})

		it('renders multiple formats', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test Multiple'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const results = await renderMultiple({
					content: mdContent,
					outputDir: dir,
					outputName: 'multi',
					formats: ['html', 'pdf'],
					cssPath: join(dir, 'style.css'),
				})

				expect(results.size).toBe(2)
				expect(results.get('html')?.success).toBe(true)

				// PDF may fail if Chromium is not installed
				const pdfResult = results.get('pdf')
				expect(
					pdfResult?.success || pdfResult?.error?.includes('Chromium'),
				).toBeTruthy()

				expect(existsSync(join(dir, 'multi.html'))).toBe(true)
			})
		})

		it('renders all three formats', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test All'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const results = await renderMultiple({
					content: mdContent,
					outputDir: dir,
					outputName: 'all-formats',
					formats: ['html', 'pdf', 'docx'],
					cssPath: join(dir, 'style.css'),
				})

				expect(results.size).toBe(3)
				expect(results.get('html')?.success).toBe(true)

				// PDF/DOCX may fail without Chromium/pdf2docx
				const pdfResult = results.get('pdf')
				expect(
					pdfResult?.success || pdfResult?.error?.includes('Chromium'),
				).toBeTruthy()

				const docxResult = results.get('docx')
				expect(
					docxResult?.success
						|| docxResult?.error?.includes('pdf2docx')
						|| docxResult?.error?.includes('Chromium'),
				).toBeTruthy()
			})
		})

		it('applies variables to all formats', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const results = await renderMultiple({
					content: mdContent,
					outputDir: dir,
					outputName: 'with-vars',
					formats: ['html'],
					cssPath: join(dir, 'style.css'),
					variables: { 'custom-var': 'custom-value' },
				})

				expect(results.get('html')?.success).toBe(true)
				const html = readFileSync(join(dir, 'with-vars.html'), 'utf-8')
				expect(html).toContain('--custom-var: custom-value')
			})
		})

		it('applies expression context to all formats', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# {{ title }}'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const results = await renderMultiple({
					content: mdContent,
					outputDir: dir,
					outputName: 'with-ctx',
					formats: ['html'],
					cssPath: join(dir, 'style.css'),
					expressionContext: { title: 'Dynamic Title' },
				})

				expect(results.get('html')?.success).toBe(true)
				const html = readFileSync(join(dir, 'with-ctx.html'), 'utf-8')
				expect(html).toContain('<h1>Dynamic Title</h1>')
			})
		})

		it('processes expressions only once (before format loop)', async () => {
			await withTempDirAsync(async dir => {
				// Use Date.now() to verify expression is evaluated once
				const mdContent = '# {{ timestamp }}'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const timestamp = Date.now()
				const results = await renderMultiple({
					content: mdContent,
					outputDir: dir,
					outputName: 'expr-once',
					formats: ['html', 'pdf'],
					cssPath: join(dir, 'style.css'),
					expressionContext: { timestamp },
				})

				expect(results.get('html')?.success).toBe(true)
				// PDF may fail without Chromium
				const pdfResult = results.get('pdf')
				expect(
					pdfResult?.success || pdfResult?.error?.includes('Chromium'),
				).toBeTruthy()

				// HTML should contain the timestamp
				const html = readFileSync(join(dir, 'expr-once.html'), 'utf-8')
				expect(html).toContain(`<h1>${timestamp}</h1>`)
			})
		})

		it('creates output directory if needed', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const outputDir = join(dir, 'nested', 'output')

				const results = await renderMultiple({
					content: mdContent,
					outputDir,
					outputName: 'nested',
					formats: ['html'],
					cssPath: join(dir, 'style.css'),
				})

				expect(results.get('html')?.success).toBe(true)
				expect(existsSync(join(outputDir, 'nested.html'))).toBe(true)
			})
		})

		it('returns results map even with partial failures', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				// No CSS file - should cause errors
				const results = await renderMultiple({
					content: mdContent,
					outputDir: dir,
					outputName: 'partial',
					formats: ['html', 'pdf'],
					cssPath: '/non/existent/style.css',
				})

				expect(results.size).toBe(2)
				expect(results.get('html')?.success).toBe(false)
				expect(results.get('pdf')?.success).toBe(false)
			})
		})
	})

	// =========================================================================
	// Browser Cleanup
	// =========================================================================

	describe('browser cleanup', () => {
		it('closes browser after PDF render', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				// Render PDF to start browser
				await render({
					content: mdContent,
					output: join(dir, 'test.pdf'),
					format: 'pdf',
					cssPath: join(dir, 'style.css'),
				})

				// Should not throw
				await expect(browserPool.closeAll()).resolves.not.toThrow()
			})
		})

		it('handles multiple close calls gracefully', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				await render({
					content: mdContent,
					output: join(dir, 'test.pdf'),
					format: 'pdf',
					cssPath: join(dir, 'style.css'),
				})

				// Multiple close calls should not throw
				await browserPool.closeAll()
				await browserPool.closeAll()
				await browserPool.closeAll()
			})
		})

		it('allows new browser launch after close', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				// First render
				const firstResult = await render({
					content: mdContent,
					output: join(dir, 'first.pdf'),
					format: 'pdf',
					cssPath: join(dir, 'style.css'),
				})

				// Close browser
				await browserPool.closeAll()

				// Second render should work (launches new browser)
				const result = await render({
					content: mdContent,
					output: join(dir, 'second.pdf'),
					format: 'pdf',
					cssPath: join(dir, 'style.css'),
				})

				// Both should have same outcome (success or Chromium error)
				if (firstResult.success) {
					expect(result.success).toBe(true)
				} else {
					expect(result.error).toContain('Chromium')
				}
			})
		})
	})

	// =========================================================================
	// Integration with Bundled Themes
	// =========================================================================

	describe('integration with bundled themes', () => {
		it('renders with classic theme', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# John Doe\n\n> contact@example.com\n\n## Experience'
				const classicCss = join(THEMES_DIR, 'classic.css')

				// Skip if themes directory doesn't exist (e.g., in CI before build)
				if (!existsSync(classicCss)) {
					return
				}

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: classicCss,
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('Times New Roman')
			})
		})

		it('renders with formal theme', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test Person\n\nContent'
				const formalCss = join(THEMES_DIR, 'formal.css')

				if (!existsSync(formalCss)) {
					return
				}

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: formalCss,
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('Palatino Linotype')
			})
		})

		it('renders with minimal theme', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# Test\n\nContent'
				const minimalCss = join(THEMES_DIR, 'minimal.css')

				if (!existsSync(minimalCss)) {
					return
				}

				const result = await render({
					content: mdContent,
					output: join(dir, 'output.html'),
					format: 'html',
					cssPath: minimalCss,
				})

				expect(result.success).toBe(true)
			})
		})
	})

	// =========================================================================
	// Edge Cases
	// =========================================================================

	describe('edge cases', () => {
		it('handles empty content', async () => {
			await withTempDirAsync(async dir => {
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: '',
					output: join(dir, 'empty.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('<!DOCTYPE html>')
			})
		})

		it('handles very long content', async () => {
			await withTempDirAsync(async dir => {
				// Generate long content
				const sections = Array(50)
					.fill(null)
					.map((_, i) => `## Section ${i}\n\nParagraph ${i} content here.`)
				const mdContent = '# Long Document\n\n' + sections.join('\n\n')

				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'long.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
			})
		})

		it('handles special characters in content', async () => {
			await withTempDirAsync(async dir => {
				const mdContent =
					'# Spëcial Chàracters\n\n<script>alert("xss")</script>\n\n& < > " \''
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'special.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
			})
		})

		it('handles unicode content', async () => {
			await withTempDirAsync(async dir => {
				const mdContent = '# 日本語タイトル\n\n中文内容\n\nKorean: 한국어'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'unicode.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('日本語タイトル')
				expect(html).toContain('中文内容')
				expect(html).toContain('한국어')
			})
		})

		it('handles content with emojis', async () => {
			await withTempDirAsync(async dir => {
				const mdContent =
					'# Resume 📄\n\n- Skills: TypeScript 💪\n- Location: 🌍'
				writeVirtualFiles(dir, {
					'style.css': SIMPLE_CSS,
				})

				const result = await render({
					content: mdContent,
					output: join(dir, 'emoji.html'),
					format: 'html',
					cssPath: join(dir, 'style.css'),
				})

				expect(result.success).toBe(true)
				const html = readFileSync(result.outputPath, 'utf-8')
				expect(html).toContain('📄')
				expect(html).toContain('💪')
			})
		})
	})
})
