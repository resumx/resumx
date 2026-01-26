import { execSync, spawn, type ChildProcess } from 'node:child_process'
import {
	readFileSync,
	writeFileSync,
	unlinkSync,
	existsSync,
	mkdirSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { generateVariablesCSS } from './config.js'

export type OutputFormat = 'pdf' | 'html' | 'docx'

export interface RenderOptions {
	input: string
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

/**
 * Create a temporary CSS file that includes variable overrides and main CSS
 */
function createTempCSS(
	cssPath: string,
	variables?: Record<string, string>,
): string {
	const originalCSS = readFileSync(cssPath, 'utf-8')
	const variablesCSS = variables ? generateVariablesCSS(variables) : ''

	// Append variable overrides AFTER original CSS so they take precedence
	const combinedCSS = originalCSS + '\n' + variablesCSS

	// Create temp file
	const tempDir = tmpdir()
	const tempPath = join(tempDir, `resum8-${Date.now()}.css`)
	writeFileSync(tempPath, combinedCSS)

	return tempPath
}

/**
 * Get the pandoc output format string
 */
function getPandocFormat(format: OutputFormat): string {
	switch (format) {
		case 'pdf':
			return 'pdf'
		case 'html':
			return 'html'
		case 'docx':
			return 'docx'
	}
}

/**
 * Build pandoc arguments for rendering
 */
function buildPandocArgs(
	options: RenderOptions,
	tempCssPath: string,
): string[] {
	const args = [
		options.input,
		'--standalone',
		`--css=${tempCssPath}`,
		'-o',
		options.output,
	]

	// Add format-specific options
	if (options.format === 'pdf') {
		args.push('--pdf-engine=weasyprint')
	} else if (options.format === 'html') {
		args.push('--embed-resources')
	}

	return args
}

/**
 * Render a markdown file to the specified format
 */
export function render(options: RenderOptions): RenderResult {
	const hasVariables =
		options.variables && Object.keys(options.variables).length > 0

	// Use temp CSS only if we have variable overrides
	const cssPath =
		hasVariables ?
			createTempCSS(options.cssPath, options.variables)
		:	options.cssPath

	try {
		// Ensure output directory exists
		const outputDir = dirname(options.output)
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true })
		}

		const args = buildPandocArgs(options, cssPath)

		execSync(`pandoc ${args.map(a => `"${a}"`).join(' ')}`, {
			stdio: ['pipe', 'pipe', 'pipe'],
			encoding: 'utf-8',
		})

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
	} finally {
		// Cleanup temp CSS if created
		if (hasVariables && existsSync(cssPath)) {
			try {
				unlinkSync(cssPath)
			} catch {
				// Ignore cleanup errors
			}
		}
	}
}

/**
 * Render to multiple formats
 */
export function renderMultiple(
	input: string,
	outputDir: string,
	outputName: string,
	formats: OutputFormat[],
	cssPath: string,
	variables?: Record<string, string>,
): Map<OutputFormat, RenderResult> {
	const results = new Map<OutputFormat, RenderResult>()

	for (const format of formats) {
		const ext = format === 'docx' ? 'docx' : format
		const output = join(outputDir, `${outputName}.${ext}`)

		const result = render({
			input,
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
