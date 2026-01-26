import { existsSync } from 'node:fs'
import { resolve, dirname, relative, basename } from 'node:path'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { requireDependencies } from '../lib/check.js'
import { resolveStyle, getDefaultStyle } from '../lib/styles.js'
import {
	loadConfig,
	parseVarFlags,
	mergeVariables,
	getStyleVariables,
} from '../lib/config.js'
import {
	renderMultiple,
	getOutputName,
	type OutputFormat,
} from '../lib/pandoc.js'

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
 * Determine which formats to render based on flags
 */
function getFormats(options: RenderCommandOptions): OutputFormat[] {
	// --all takes precedence
	if (options.all) {
		return ['pdf', 'html', 'docx']
	}

	const formats: OutputFormat[] = []

	if (options.pdf) formats.push('pdf')
	if (options.html) formats.push('html')
	if (options.word) formats.push('docx')

	// Default to PDF if no format specified
	if (formats.length === 0) {
		formats.push('pdf')
	}

	return formats
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
	// Load config file
	const config = loadConfig(cwd)

	// Resolve style (CLI > config > default)
	const styleArg = options.style ?? config?.style
	const styleName = styleArg ?? getDefaultStyle()
	let cssPath: string
	try {
		cssPath = resolveStyle(styleArg, cwd)
	} catch (error) {
		console.error(chalk.red(`Error: ${(error as Error).message}`))
		return false
	}

	// Merge variables (CLI > project config > global style defaults)
	const globalStyleVars = getStyleVariables(styleName, options._configDir)
	const cliVars = options.var ? parseVarFlags(options.var) : undefined
	const variables = mergeVariables(globalStyleVars, config?.variables, cliVars)
	const hasVariables = Object.keys(variables).length > 0

	// Determine output name and directory
	let outputName: string
	let outputDir: string

	if (options.output) {
		// Check if output ends with slash (directory only, preserve input filename)
		const endsWithSlash = options.output.endsWith('/')

		if (endsWithSlash) {
			// Use input filename in specified directory
			outputName = getOutputName(inputPath)
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
		// No -o flag: output to cwd
		outputName = getOutputName(inputPath)
		outputDir = cwd
	}

	// Get formats to render
	const formats = getFormats(options)

	// Check dependencies
	const needsPdf = formats.includes('pdf')
	try {
		requireDependencies({ pdf: needsPdf })
	} catch (error) {
		console.error(chalk.red(`Error: ${(error as Error).message}`))
		return false
	}

	console.log(chalk.yellow(`Building resume from: ${inputPath}`))
	console.log('')

	// Render each format
	const results = renderMultiple(
		inputPath,
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

	// Run initial render
	const success = runRender(inputFile, inputPath, options, cwd)

	if (!options.watch) {
		process.exit(success ? 0 : 1)
	}

	// Watch mode
	console.log('')
	console.log(chalk.yellow('Watching for changes...') + ' (Ctrl+C to stop)')

	// Resolve style for watching
	const config = loadConfig(cwd)
	const styleArg = options.style ?? config?.style
	let cssPath: string
	try {
		cssPath = resolveStyle(styleArg, cwd)
	} catch {
		cssPath = '' // Will be empty if style not found, but we already errored above
	}

	const watchPaths = [inputPath]
	if (cssPath && existsSync(cssPath)) {
		watchPaths.push(cssPath)
	}

	console.log(`  Watching: ${watchPaths.join(', ')}`)
	console.log('')

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
			console.log(chalk.yellow('Change detected, rebuilding...'))
			runRender(inputFile, inputPath, options, cwd)
			console.log(chalk.green('Ready.'))
		}, 150)
	})

	// Keep process alive
	process.on('SIGINT', () => {
		console.log('')
		console.log(chalk.yellow('Stopped watching.'))
		watcher.close()
		process.exit(0)
	})
}
