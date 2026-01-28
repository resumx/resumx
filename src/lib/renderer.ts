import { execSync } from 'node:child_process'
import {
	readFileSync,
	writeFileSync,
	unlinkSync,
	existsSync,
	mkdirSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import { dl } from '@mdit/plugin-dl'
import { mark } from '@mdit/plugin-mark'
import { bracketedSpans } from './markdown-it-bracketed-spans.js'
import { generateVariablesCSS } from './config.js'
import { resolveCssImports } from './css-resolver.js'

export type OutputFormat = 'pdf' | 'html' | 'docx'

export interface RenderOptions {
	content: string
	output: string
	format: OutputFormat
	cssPath: string
	variables?: Record<string, string>
}

export interface RenderResult {
	success: boolean
	outputPath: string
	error?: string
}

// Initialize markdown-it with bracketed-spans and attrs plugins
// CRITICAL: bracketedSpans MUST come BEFORE attrs for proper attribute application
const md = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
})
	.use(bracketedSpans)
	.use(dl)
	.use(mark)
	.use(attrs)

/**
 * Resolve CSS and combine with variable overrides
 */
function resolveCSS(
	cssPath: string,
	variables?: Record<string, string>,
): string {
	// Resolve @import statements
	const resolvedCSS = resolveCssImports(cssPath)
	const variablesCSS = variables ? generateVariablesCSS(variables) : ''

	// Append variable overrides AFTER resolved CSS so they take precedence
	return resolvedCSS + '\n' + variablesCSS
}

/**
 * Convert markdown to standalone HTML with embedded CSS
 */
function markdownToHtml(content: string, css: string): string {
	// Render markdown with bracketed-spans plugin handling [text]{.class} syntax
	const body = md.render(content)

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${css}
</style>
</head>
<body>
${body}
</body>
</html>`
}

/**
 * Create a temporary file with the given content
 */
function createTempFile(content: string, extension: string): string {
	const tempDir = tmpdir()
	const tempPath = join(tempDir, `resum8-${Date.now()}${extension}`)
	writeFileSync(tempPath, content)
	return tempPath
}

/**
 * Clean up a temporary file
 */
function cleanupTempFile(path: string): void {
	if (existsSync(path)) {
		try {
			unlinkSync(path)
		} catch {
			// Ignore cleanup errors
		}
	}
}

/**
 * Render HTML to PDF using WeasyPrint CLI
 */
function renderPdf(html: string, outputPath: string): void {
	const tempHtmlPath = createTempFile(html, '.html')

	try {
		execSync(`weasyprint "${tempHtmlPath}" "${outputPath}"`, {
			stdio: ['pipe', 'pipe', 'pipe'],
			encoding: 'utf-8',
		})
	} finally {
		cleanupTempFile(tempHtmlPath)
	}
}

/**
 * Render PDF to DOCX using pdf2docx CLI
 * This provides higher fidelity conversion by leveraging the PDF layout
 * Requires: pip install pdf2docx
 */
function renderDocxFromPdf(pdfPath: string, outputPath: string): void {
	try {
		execSync(`pdf2docx convert "${pdfPath}" "${outputPath}"`, {
			stdio: ['pipe', 'pipe', 'pipe'],
			encoding: 'utf-8',
		})
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown error during conversion'
		throw new Error(`pdf2docx failed: ${message}`)
	}
}

/**
 * Render markdown content to the specified format
 */
export async function render(options: RenderOptions): Promise<RenderResult> {
	try {
		// Resolve CSS with variable overrides
		const css = resolveCSS(options.cssPath, options.variables)

		// Convert markdown to standalone HTML
		const html = markdownToHtml(options.content, css)

		// Ensure output directory exists
		const outputDir = dirname(options.output)
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true })
		}

		// Render to the requested format
		switch (options.format) {
			case 'html':
				writeFileSync(options.output, html)
				break
			case 'pdf':
				renderPdf(html, options.output)
				break
			case 'docx': {
				// Generate PDF first (temporary), then convert to DOCX for high fidelity
				const tempPdfPath = createTempFile('', '.pdf')
				try {
					renderPdf(html, tempPdfPath)
					renderDocxFromPdf(tempPdfPath, options.output)
				} finally {
					cleanupTempFile(tempPdfPath)
				}
				break
			}
		}

		return {
			success: true,
			outputPath: options.output,
		}
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Unknown error during render'
		return {
			success: false,
			outputPath: options.output,
			error: message,
		}
	}
}

/**
 * Render content to multiple formats
 */
export async function renderMultiple(
	content: string,
	outputDir: string,
	outputName: string,
	formats: OutputFormat[],
	cssPath: string,
	variables?: Record<string, string>,
): Promise<Map<OutputFormat, RenderResult>> {
	const results = new Map<OutputFormat, RenderResult>()

	for (const format of formats) {
		const ext = format === 'docx' ? 'docx' : format
		const output = join(outputDir, `${outputName}.${ext}`)

		const result = await render({
			content,
			output,
			format,
			cssPath,
			variables,
		})

		results.set(format, result)
	}

	return results
}

/**
 * Extract name from the first H1 heading in markdown
 * Returns PascalCase name or undefined
 */
export function extractNameFromMarkdown(mdPath: string): string | undefined {
	try {
		const content = readFileSync(mdPath, 'utf-8')
		const match = content.match(/^#\s+(.+)$/m)
		if (!match?.[1]) return undefined

		// Convert to PascalCase: capitalize each word, remove spaces
		const name = match[1]
			.trim()
			.split(/\s+/)
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join('')

		return name
	} catch {
		return undefined
	}
}

/**
 * Get default output name from input file
 * Uses the input filename without extension
 */
export function getOutputName(inputPath: string): string {
	// Use input filename without extension
	return basename(inputPath, '.md')
}
