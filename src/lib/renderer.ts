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
import { browserPool } from './browser-pool.js'
import { generateHtml } from './html-generator.js'
import { processExpressions } from './interpolation.js'

export type OutputFormat = 'pdf' | 'html' | 'docx' | 'png'

export interface RenderOptions {
	content: string
	output: string
	format: OutputFormat
	cssPath: string
	variables?: Record<string, string>
	expressionContext?: Record<string, unknown>
	activeRole?: string
}

export interface RenderResult {
	success: boolean
	outputPath: string
	error?: string
}

/**
 * Create a temporary file with the given content
 */
function createTempFile(content: string, extension: string): string {
	const tempDir = tmpdir()
	const tempPath = join(tempDir, `resumx-${Date.now()}${extension}`)
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
 * Render HTML to PDF using Playwright (headless Chrome/Chromium)
 * Uses browser pool for parallel rendering
 */
async function renderPdf(html: string, outputPath: string): Promise<void> {
	const browser = await browserPool.acquire()
	try {
		const page = await browser.newPage()
		try {
			await page.setContent(html, { waitUntil: 'networkidle' })
			await page.pdf({
				path: outputPath,
				printBackground: true,
				preferCSSPageSize: true,
			})
		} finally {
			await page.close()
		}
	} finally {
		browserPool.release(browser)
	}
}

/**
 * Render HTML to PNG using Playwright (headless Chrome/Chromium)
 * Uses browser pool for parallel rendering
 * Viewport is set to A4 width (794px) with 2x device scale for high-res output
 */
async function renderPng(html: string, outputPath: string): Promise<void> {
	const browser = await browserPool.acquire()
	try {
		const context = await browser.newContext({
			viewport: { width: 794, height: 1123 },
			deviceScaleFactor: 2,
		})
		try {
			const page = await context.newPage()
			try {
				await page.setContent(html, { waitUntil: 'networkidle' })
				await page.screenshot({ path: outputPath, fullPage: true })
			} finally {
				await page.close()
			}
		} finally {
			await context.close()
		}
	} finally {
		browserPool.release(browser)
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
		// Convert markdown to standalone HTML with Tailwind CSS compilation
		const html = await generateHtml(options.content, {
			cssPath: options.cssPath,
			variables: options.variables,
			expressionContext: options.expressionContext,
			activeRole: options.activeRole,
		})

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
				await renderPdf(html, options.output)
				break
			case 'png':
				await renderPng(html, options.output)
				break
			case 'docx': {
				// Generate PDF first (temporary), then convert to DOCX for high fidelity
				const tempPdfPath = createTempFile('', '.pdf')
				try {
					await renderPdf(html, tempPdfPath)
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
 * Options for renderMultiple
 */
export interface RenderMultipleOptions {
	content: string
	outputDir: string
	outputName: string
	formats: OutputFormat[]
	cssPath: string
	variables?: Record<string, string>
	expressionContext?: Record<string, unknown>
	activeRole?: string
}

/**
 * Render content to multiple formats in parallel
 */
export async function renderMultiple(
	options: RenderMultipleOptions,
): Promise<Map<OutputFormat, RenderResult>> {
	const {
		content,
		outputDir,
		outputName,
		formats,
		cssPath,
		variables,
		expressionContext,
		activeRole,
	} = options

	// Process expressions once before rendering to any format
	const processedContent =
		expressionContext ?
			await processExpressions(content, expressionContext)
		:	content

	// Render all formats in parallel
	const renderPromises = formats.map(async format => {
		const ext = format === 'docx' ? 'docx' : format
		const output = join(outputDir, `${outputName}.${ext}`)

		const result = await render({
			content: processedContent,
			output,
			format,
			cssPath,
			variables,
			activeRole,
		})

		return [format, result] as const
	})

	const results = await Promise.all(renderPromises)

	return new Map(results)
}

const DOC_EXTENSIONS = ['.pdf', '.html', '.htm', '.docx', '.doc', '.png']

/**
 * Strip document extensions (.pdf, .html, etc.) from a filename
 * to avoid double extensions like resume.pdf.html
 */
export function stripDocExtension(name: string): string {
	for (const ext of DOC_EXTENSIONS) {
		if (name.endsWith(ext)) return name.slice(0, -ext.length)
	}
	return name
}

/**
 * Clean up a path after template expansion:
 * - Collapse repeated separators (-, _) into one
 * - Trim separators from start/end of each path segment
 * - Remove empty path segments
 */
export function cleanupPath(path: string): string {
	return path
		.split('/')
		.map(s =>
			s
				.replace(/-{2,}/g, '-')
				.replace(/_{2,}/g, '_')
				.replace(/^[-_]+|[-_]+$/g, ''),
		)
		.filter(Boolean)
		.join('/')
}

/**
 * Extract name from the first H1 heading in a markdown string
 * Returns underscore-separated name or undefined
 * e.g. "# Jane Smith" → "Jane_Smith"
 */
export function extractNameFromContent(content: string): string | undefined {
	const match = content.match(/^#\s+(.+)$/m)
	if (!match?.[1]) return undefined

	return match[1].trim().split(/\s+/).join('_')
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
