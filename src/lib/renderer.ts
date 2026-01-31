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
import { chromium } from 'playwright'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import { dl } from '@mdit/plugin-dl'
import { mark } from '@mdit/plugin-mark'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'
import { icon } from './mdit-plugins/icon/index.js'
import { bracketedSpans } from './mdit-plugins/bracketed-span/index.js'
import { generateVariablesCSS } from './styles.js'
import { resolveCssImports } from './css-resolver.js'
import { compileTailwindCSS } from './tailwind.js'
import { processExpressions } from './interpolation.js'
import {
	iconifyResolver,
	resumxIconResolver,
} from './mdit-plugins/icon/renderer.js'

export type OutputFormat = 'pdf' | 'html' | 'docx'

export interface RenderOptions {
	content: string
	output: string
	format: OutputFormat
	cssPath: string
	variables?: Record<string, string>
	expressionContext?: Record<string, unknown>
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
	.use(icon, { resolvers: [resumxIconResolver, iconifyResolver] })
	.use(dl)
	.use(mark)
	.use(attrs)
	.use(sub)
	.use(sup)

/**
 * Resolve CSS and combine with variable overrides
 */
function resolveBaseCSS(
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
 * Includes Tailwind CSS compilation for utility classes used in the content
 */
async function markdownToHtml(
	content: string,
	cssPath: string,
	variables?: Record<string, string>,
	expressionContext?: Record<string, unknown>,
): Promise<string> {
	// Process {{ }} expressions before markdown rendering
	const processedContent =
		expressionContext ?
			await processExpressions(content, expressionContext)
		:	content

	// Render markdown to HTML body
	const body = md.render(processedContent)

	// Compile Tailwind CSS for classes used in the HTML body
	const tailwindCSS = await compileTailwindCSS(body)

	// Resolve base CSS with variable overrides
	const baseCSS = resolveBaseCSS(cssPath, variables)

	// Combine CSS: Tailwind first (resets/utilities), then base styles (can override)
	const combinedCSS = tailwindCSS + '\n' + baseCSS

	// Assemble final HTML
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>
<style>
${combinedCSS}
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
 * Shared browser instance for reuse across renders (faster in watch mode)
 */
let sharedBrowser: Awaited<ReturnType<typeof chromium.launch>> | null = null
let browserPromise: Promise<
	Awaited<ReturnType<typeof chromium.launch>>
> | null = null

/**
 * Get or create a shared browser instance
 * Reuses existing browser for faster subsequent renders
 */
async function getBrowser() {
	// Return existing browser if available and connected
	if (sharedBrowser?.isConnected()) {
		return sharedBrowser
	}

	// If browser is being launched, wait for it
	if (browserPromise) {
		return browserPromise
	}

	// Launch new browser
	browserPromise = launchBrowserInstance()
	try {
		sharedBrowser = await browserPromise
		return sharedBrowser
	} finally {
		browserPromise = null
	}
}

/**
 * Launch Playwright's Chromium for PDF rendering
 * Uses Playwright's downloaded Chromium (optimized for headless automation)
 */
async function launchBrowserInstance() {
	try {
		return await chromium.launch({ headless: true })
	} catch {
		throw new Error(
			'Chromium not found. Please run: npx playwright install chromium',
		)
	}
}

/**
 * Close the shared browser instance
 * Call this when done with all rendering (e.g., on process exit)
 */
export async function closeBrowser(): Promise<void> {
	if (sharedBrowser) {
		await sharedBrowser.close()
		sharedBrowser = null
	}
}

// Cleanup browser on process exit
process.on('exit', () => {
	sharedBrowser?.close()
})
process.on('SIGINT', async () => {
	await closeBrowser()
	process.exit(0)
})
process.on('SIGTERM', async () => {
	await closeBrowser()
	process.exit(0)
})

/**
 * Render HTML to PDF using Playwright (headless Chrome/Chromium)
 * Reuses browser instance for faster subsequent renders
 */
async function renderPdf(html: string, outputPath: string): Promise<void> {
	const browser = await getBrowser()
	const page = await browser.newPage()
	try {
		await page.setContent(html, { waitUntil: 'networkidle' })
		await page.pdf({
			path: outputPath,
			format: 'Letter',
			printBackground: true,
			preferCSSPageSize: true,
		})
	} finally {
		await page.close()
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
		const html = await markdownToHtml(
			options.content,
			options.cssPath,
			options.variables,
			options.expressionContext,
		)

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
 * Render content to multiple formats
 */
export async function renderMultiple(
	content: string,
	outputDir: string,
	outputName: string,
	formats: OutputFormat[],
	cssPath: string,
	variables?: Record<string, string>,
	expressionContext?: Record<string, unknown>,
): Promise<Map<OutputFormat, RenderResult>> {
	const results = new Map<OutputFormat, RenderResult>()

	// Process expressions once before rendering to any format
	const processedContent =
		expressionContext ?
			await processExpressions(content, expressionContext)
		:	content

	for (const format of formats) {
		const ext = format === 'docx' ? 'docx' : format
		const output = join(outputDir, `${outputName}.${ext}`)

		const result = await render({
			content: processedContent,
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
