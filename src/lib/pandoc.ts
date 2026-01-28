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

/**
 * Create a temporary CSS file that includes variable overrides and main CSS
 * Resolves all @import statements to inline the imported CSS
 */
function createTempCSS(
	cssPath: string,
	variables?: Record<string, string>,
): string {
	// Resolve @import statements first
	const resolvedCSS = resolveCssImports(cssPath)
	const variablesCSS = variables ? generateVariablesCSS(variables) : ''

	// Append variable overrides AFTER resolved CSS so they take precedence
	const combinedCSS = resolvedCSS + '\n' + variablesCSS

	// Create temp file
	const tempDir = tmpdir()
	const tempPath = join(tempDir, `resum8-${Date.now()}.css`)
	writeFileSync(tempPath, combinedCSS)

	return tempPath
}

/**
 * Build pandoc arguments for rendering
 */
function buildPandocArgs(
	inputPath: string,
	outputPath: string,
	format: OutputFormat,
	cssPath: string,
): string[] {
	const args = [inputPath, '--standalone', `--css=${cssPath}`, '-o', outputPath]

	// Add format-specific options
	if (format === 'pdf') {
		args.push('--pdf-engine=weasyprint')
	} else if (format === 'html') {
		args.push('--embed-resources')
	}

	return args
}

/**
 * Create a temporary markdown file with the given content
 */
function createTempMarkdown(content: string): string {
	const tempDir = tmpdir()
	const tempPath = join(tempDir, `resum8-${Date.now()}.md`)
	writeFileSync(tempPath, content)
	return tempPath
}

/**
 * Render markdown content to the specified format
 */
export function render(options: RenderOptions): RenderResult {
	// Always create temp CSS to resolve @import statements
	// This ensures Pandoc gets a single CSS file with all imports inlined
	const cssPath = createTempCSS(options.cssPath, options.variables)

	// Always create temp markdown file from content
	const inputPath = createTempMarkdown(options.content)

	try {
		// Ensure output directory exists
		const outputDir = dirname(options.output)
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true })
		}

		const args = buildPandocArgs(
			inputPath,
			options.output,
			options.format,
			cssPath,
		)

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
		// Cleanup temp CSS
		if (existsSync(cssPath)) {
			try {
				unlinkSync(cssPath)
			} catch {
				// Ignore cleanup errors
			}
		}
		// Cleanup temp markdown
		if (existsSync(inputPath)) {
			try {
				unlinkSync(inputPath)
			} catch {
				// Ignore cleanup errors
			}
		}
	}
}

/**
 * Render content to multiple formats
 */
export function renderMultiple(
	content: string,
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
