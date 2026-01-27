import { existsSync } from 'node:fs'
import { resolve, dirname, relative, basename } from 'node:path'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { requireDependencies } from '../lib/check.js'
import { resolveStyle, getDefaultStyle } from '../lib/styles.js'
import {
	parseVarFlags,
	mergeVariables,
	getStyleVariables,
} from '../lib/config.js'
import {
	renderMultiple,
	getOutputName,
	type OutputFormat,
} from '../lib/pandoc.js'
import { parseFrontmatter } from '../lib/frontmatter.js'

export interface RenderCommandOptions {
	style?: string
	output?: string
	var?: string[]
	pdf?: boolean
	html?: boolean
	word?: boolean
	all?: boolean
	watch?: boolean
	_configDir?: string // For testing global style variables
}

/**
 * Determine which formats to render based on CLI options and frontmatter
 * CLI flags take precedence over frontmatter
 */
function resolveFormats(
	options: RenderCommandOptions,
	frontmatterFormats?: OutputFormat[],
): OutputFormat[] {
	// --all takes precedence
	if (options.all) {
		return ['pdf', 'html', 'docx']
	}

	// Check if any CLI format flags are set
	const cliFormats: OutputFormat[] = []
	if (options.pdf) cliFormats.push('pdf')
	if (options.html) cliFormats.push('html')
	if (options.word) cliFormats.push('docx')

	// If CLI format flags are set, use them
	if (cliFormats.length > 0) {
		return cliFormats
	}

	// If frontmatter specifies formats, use them
	if (frontmatterFormats && frontmatterFormats.length > 0) {
		return frontmatterFormats
	}

	// Default to PDF
	return ['pdf']
}

/**
 * Run a single render cycle
 */
function runRender(
	inputFile: string,
	inputPath: string,
	options: RenderCommandOptions,
	cwd: string,
): boolean {
	// Parse frontmatter from input file
	const { config: fmConfig, content, warnings } = parseFrontmatter(inputPath)

	// Display warnings for unknown frontmatter fields
	for (const warning of warnings) {
		console.warn(chalk.yellow(`Warning: ${warning}`))
	}

	// Resolve style (CLI > Frontmatter > Global default)
	const styleArg = options.style ?? fmConfig?.style
	const styleName = styleArg ?? getDefaultStyle()
	let cssPath: string
	try {
		cssPath = resolveStyle(styleArg, cwd)
	} catch (error) {
		console.error(chalk.red(`Error: ${(error as Error).message}`))
		return false
	}

	// Merge variables (CLI > Frontmatter > Global style defaults)
	const globalStyleVars = getStyleVariables(styleName, options._configDir)
	const cliVars = options.var ? parseVarFlags(options.var) : undefined
	const variables = mergeVariables(
		globalStyleVars,
		fmConfig?.variables,
		cliVars,
	)
	const hasVariables = Object.keys(variables).length > 0

	// Determine output name and directory (CLI > Frontmatter > defaults)
	let outputName: string
	let outputDir: string

	if (options.output) {
		// CLI -o flag takes precedence
		const endsWithSlash = options.output.endsWith('/')

		if (endsWithSlash) {
			// Use frontmatter outputName or input filename in specified directory
			outputName = fmConfig?.outputName ?? getOutputName(inputPath)
			outputDir = resolve(cwd, options.output)
		} else {
			// Split path into directory and filename
			const resolvedOutput = resolve(cwd, options.output)
			outputDir = dirname(resolvedOutput)

			// Get basename and strip document extensions
			let baseName = basename(resolvedOutput)
			const documentExtensions = ['.pdf', '.html', '.htm', '.docx', '.doc']
			for (const ext of documentExtensions) {
				if (baseName.endsWith(ext)) {
					baseName = baseName.slice(0, -ext.length)
					break
				}
			}
			outputName = baseName
		}
	} else {
		// No CLI -o flag: check frontmatter, then defaults
		outputName = fmConfig?.outputName ?? getOutputName(inputPath)
		outputDir = fmConfig?.outputDir ? resolve(cwd, fmConfig.outputDir) : cwd
	}

	// Get formats to render (CLI > Frontmatter > default)
	const formats = resolveFormats(options, fmConfig?.formats)

	// Check dependencies
	const needsPdf = formats.includes('pdf')
	try {
		requireDependencies({ pdf: needsPdf })
	} catch (error) {
		console.error(chalk.red(`Error: ${(error as Error).message}`))
		return false
	}

	console.log(`Building resume from: ${inputPath}`)
	console.log('')

	// Render content (frontmatter already stripped)
	const results = renderMultiple(
		content,
		outputDir,
		outputName,
		formats,
		cssPath,
		hasVariables ? variables : undefined,
	)

	let allSuccess = true

	for (const [format, result] of results) {
		const formatLabel = format.toUpperCase().padEnd(4)
		if (result.success) {
			const relativePath = relative(cwd, result.outputPath)
			console.log(`  ${formatLabel}... ${chalk.green('✓')} ${relativePath}`)
		} else {
			console.log(`  ${formatLabel}... ${chalk.red('✗')} ${result.error}`)
			allSuccess = false
		}
	}

	console.log('')

	if (allSuccess) {
		console.log(chalk.green('Done!'))
	} else {
		console.log(chalk.red('Some formats failed to render.'))
	}

	return allSuccess
}

/**
 * Main render command handler
 */
export async function renderCommand(
	inputFile: string,
	options: RenderCommandOptions,
): Promise<void> {
	const cwd = process.cwd()

	// Resolve input file path
	const inputPath = resolve(cwd, inputFile)

	if (!existsSync(inputPath)) {
		console.error(chalk.red(`Error: Input file not found: ${inputPath}`))
		process.exit(1)
	}

	// Resolve watch paths (needed for both message and watcher setup)
	const { config: fmConfig } = parseFrontmatter(inputPath)
	const styleArg = options.style ?? fmConfig?.style
	let cssPath = ''
	try {
		cssPath = resolveStyle(styleArg, cwd)
	} catch {
		// Will error during render if style not found
	}

	const watchPaths = [inputPath]
	if (cssPath && existsSync(cssPath)) {
		watchPaths.push(cssPath)
	}

	// Print watch message before initial render
	if (options.watch) {
		const relativeWatchPaths = watchPaths.map(p => relative(process.cwd(), p))
		console.log(
			chalk.blue(`Watching for changes...`)
				+ ` (${relativeWatchPaths.join(', ')})`,
		)
		console.log('')
	}

	// Run initial render
	const success = runRender(inputFile, inputPath, options, cwd)

	if (!options.watch) {
		process.exit(success ? 0 : 1)
	}

	// Debounce rapid changes
	let debounceTimer: ReturnType<typeof setTimeout> | null = null

	const watcher = chokidar.watch(watchPaths, {
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 100,
			pollInterval: 50,
		},
	})

	watcher.on('change', path => {
		if (debounceTimer) {
			clearTimeout(debounceTimer)
		}

		debounceTimer = setTimeout(() => {
			console.log('')
			console.log(chalk.blue('Change detected, rebuilding...'))
			runRender(inputFile, inputPath, options, cwd)
		}, 150)
	})

	// Keep process alive
	process.on('SIGINT', () => {
		console.log('')
		console.log('Stopped watching.')
		watcher.close()
		process.exit(0)
	})
}
