import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve, dirname, relative, basename, join } from 'node:path'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { requireDependencies } from '../lib/check.js'
import { resolveStyle } from '../lib/styles.js'
import { config, type ConfigStore } from '../lib/config.js'
import { parseVarFlags } from './utils/var-flags.js'
import { mergeVariables } from '../lib/styles.js'
import {
	renderMultiple,
	getOutputName,
	type OutputFormat,
} from '../lib/renderer.js'
import { parseFrontmatter } from '../lib/frontmatter.js'
import { renderMarkdown } from '../lib/markdown.js'
import { extractRoles, resolveRoles } from '../lib/roles.js'

/**
 * Resolve which styles to use (CLI > Frontmatter > Global default)
 * Returns array of style names
 */
function resolveStyles(
	cliStyles: string[] | undefined,
	frontmatterStyles: string[] | undefined,
	defaultStyle: string,
): string[] {
	// CLI takes precedence
	if (cliStyles && cliStyles.length > 0) {
		return cliStyles
	}

	// Frontmatter styles
	if (frontmatterStyles && frontmatterStyles.length > 0) {
		return frontmatterStyles
	}

	// Global default
	return [defaultStyle]
}

export interface RenderCommandOptions {
	style?: string[]
	output?: string
	var?: string[]
	role?: string[]
	pdf?: boolean
	html?: boolean
	docx?: boolean
	all?: boolean
	watch?: boolean
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
	if (options.docx) cliFormats.push('docx')

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
 * Render task representing a single (style, role) combination
 */
interface RenderTask {
	styleName: string
	cssPath: string
	variables: Record<string, string>
	outputDir: string
	outputName: string
	activeRole: string | undefined
	label: string
}

/**
 * Build render tasks for all style × role combinations
 *
 * Output naming rules:
 * - 1 style, no roles    → resume.pdf
 * - 1 style, roles       → resume-frontend.pdf
 * - multi-style, no roles → resume-formal.pdf
 * - multi-style + roles   → frontend/resume-formal.pdf
 */
function buildRenderTasks(
	styles: Array<{
		name: string
		cssPath: string
		variables: Record<string, string>
	}>,
	roles: string[],
	baseOutputDir: string,
	baseOutputName: string,
): RenderTask[] {
	const tasks: RenderTask[] = []
	const hasMultipleStyles = styles.length > 1
	const hasRoles = roles.length > 0

	for (const style of styles) {
		const effectiveRoles = hasRoles ? roles : [undefined]

		for (const role of effectiveRoles) {
			let outputDir = baseOutputDir
			let outputName = baseOutputName
			const labelParts: string[] = []

			if (hasMultipleStyles && hasRoles && role) {
				// multi-style + roles → frontend/resume-formal.pdf
				outputDir = join(baseOutputDir, role)
				outputName = `${baseOutputName}-${style.name}`
				labelParts.push(`role: ${role}`, `style: ${style.name}`)
			} else if (hasMultipleStyles) {
				// multi-style, no roles → resume-formal.pdf
				outputName = `${baseOutputName}-${style.name}`
				labelParts.push(`style: ${style.name}`)
			} else if (hasRoles && role) {
				// 1 style, roles → resume-frontend.pdf
				outputName = `${baseOutputName}-${role}`
				labelParts.push(`role: ${role}`)
			}
			// else: 1 style, no roles → resume.pdf (no suffix)

			tasks.push({
				styleName: style.name,
				cssPath: style.cssPath,
				variables: style.variables,
				outputDir,
				outputName,
				activeRole: role,
				label: labelParts.length > 0 ? `[${labelParts.join(', ')}]` : '',
			})
		}
	}

	return tasks
}

/**
 * Run a single render cycle
 */
async function runRender(
	inputFile: string,
	inputPath: string,
	options: RenderCommandOptions,
	cwd: string,
	store: ConfigStore = config,
): Promise<boolean> {
	// Parse frontmatter from input file
	const { config: fmConfig, content, warnings } = parseFrontmatter(inputPath)

	// Display warnings for unknown frontmatter fields
	for (const warning of warnings) {
		console.warn(chalk.yellow(`Warning: ${warning}`))
	}

	// Resolve styles (CLI > Frontmatter > Global default)
	const styleNames = resolveStyles(
		options.style,
		fmConfig?.style,
		store.defaultStyle,
	)

	// Resolve each style to CSS path and variables
	const styles: Array<{
		name: string
		cssPath: string
		variables: Record<string, string>
	}> = []
	for (const styleName of styleNames) {
		let cssPath: string
		try {
			cssPath = resolveStyle(styleName, cwd)
		} catch (error) {
			console.error(chalk.red(`Error: ${(error as Error).message}`))
			return false
		}

		// Merge variables (CLI > Frontmatter > Global style defaults)
		const globalStyleVars = store.getStyleVariables(styleName)
		const cliVars = options.var ? parseVarFlags(options.var) : undefined
		const variables = mergeVariables(
			globalStyleVars,
			fmConfig?.variables,
			cliVars,
		)

		styles.push({ name: styleName, cssPath, variables })
	}

	// Determine base output name and directory (CLI > Frontmatter > defaults)
	let baseOutputName: string
	let baseOutputDir: string

	if (options.output) {
		// CLI -o flag takes precedence
		const endsWithSlash = options.output.endsWith('/')

		if (endsWithSlash) {
			// Use frontmatter outputName or input filename in specified directory
			baseOutputName = fmConfig?.outputName ?? getOutputName(inputPath)
			baseOutputDir = resolve(cwd, options.output)
		} else {
			// Split path into directory and filename
			const resolvedOutput = resolve(cwd, options.output)
			baseOutputDir = dirname(resolvedOutput)

			// Get basename and strip document extensions
			let baseName = basename(resolvedOutput)
			const documentExtensions = ['.pdf', '.html', '.htm', '.docx', '.doc']
			for (const ext of documentExtensions) {
				if (baseName.endsWith(ext)) {
					baseName = baseName.slice(0, -ext.length)
					break
				}
			}
			baseOutputName = baseName
		}
	} else {
		// No CLI -o flag: check frontmatter, then defaults
		baseOutputName = fmConfig?.outputName ?? getOutputName(inputPath)
		baseOutputDir = fmConfig?.outputDir ? resolve(cwd, fmConfig.outputDir) : cwd
	}

	// Get formats to render (CLI > Frontmatter > default)
	const formats = resolveFormats(options, fmConfig?.formats)

	// Check dependencies
	// Only pdf2docx is required for DOCX output (PDF uses bundled Playwright Chromium)
	const needsDocx = formats.includes('docx')
	try {
		requireDependencies({ docx: needsDocx })
	} catch (error) {
		console.error(chalk.red(`Error: ${(error as Error).message}`))
		return false
	}

	const relativeInputPath = relative(cwd, inputPath)
	console.log(`Building resume from: ${chalk.cyan(relativeInputPath)}\n`)

	// Build expression context from frontmatter (all properties directly accessible)
	const expressionContext: Record<string, unknown> = {
		// Expose environment variables as `env`
		env: process.env,
		// Expose shell execution helper
		exec: (cmd: string) => {
			try {
				return execSync(cmd, { encoding: 'utf-8', cwd, stdio: 'pipe' }).trim()
			} catch (error) {
				// Extract stderr and throw it for evaluateExpression to handle
				const stderr =
					error instanceof Error && 'stderr' in error ?
						String((error as { stderr: Buffer }).stderr).trim()
					:	String(error)
				throw new Error(`exec failed: ${stderr}`)
			}
		},
		// Spread all frontmatter properties into the context
		...(fmConfig ?? {}),
	}

	// Discover roles from content (render markdown first to get HTML)
	const html = renderMarkdown(content)
	const discoveredRoles = extractRoles(html)

	// Resolve which roles to generate (priority: CLI > frontmatter > discovered)
	let rolesToGenerate: string[]
	try {
		rolesToGenerate = resolveRoles({
			explicit: options.role,
			configured: fmConfig?.roles,
			discovered: discoveredRoles,
		})
	} catch (error) {
		console.error(chalk.red(`Error: ${(error as Error).message}`))
		return false
	}

	// Build render tasks for all style × role combinations
	const renderTasks = buildRenderTasks(
		styles,
		rolesToGenerate,
		baseOutputDir,
		baseOutputName,
	)

	// Render all tasks in parallel
	const taskResults = await Promise.all(
		renderTasks.map(async task => {
			const hasVariables = Object.keys(task.variables).length > 0
			const results = await renderMultiple({
				content,
				outputDir: task.outputDir,
				outputName: task.outputName,
				formats,
				cssPath: task.cssPath,
				variables: hasVariables ? task.variables : undefined,
				expressionContext:
					Object.keys(expressionContext).length > 0 ?
						expressionContext
					:	undefined,
				activeRole: task.activeRole,
			})
			return { label: task.label, results }
		}),
	)

	// Print results in order
	let allSuccess = true
	for (const { label, results } of taskResults) {
		if (label) {
			console.log(chalk.dim(`  ${label}`))
		}
		for (const [format, result] of results) {
			const formatLabel = format.toUpperCase().padEnd(4)
			if (result.success) {
				const relativePath = relative(cwd, result.outputPath)
				console.log(`  ${formatLabel}... ${chalk.green('✓')} ${relativePath}`)
			} else {
				console.log(
					`  ${formatLabel}... ${chalk.red('✗')} ${chalk.red(result.error)}`,
				)
				allSuccess = false
			}
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
	store: ConfigStore = config,
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
	const styleNamesForWatch = resolveStyles(
		options.style,
		fmConfig?.style,
		store.defaultStyle,
	)

	// Collect CSS paths for all styles
	const cssPaths: string[] = []
	for (const styleName of styleNamesForWatch) {
		try {
			const cssPath = resolveStyle(styleName, cwd)
			if (existsSync(cssPath)) {
				cssPaths.push(cssPath)
			}
		} catch {
			// Will error during render if style not found
		}
	}

	const watchPaths = [inputPath, ...cssPaths]

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
	const success = await runRender(inputFile, inputPath, options, cwd, store)

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

	watcher.on('change', () => {
		if (debounceTimer) {
			clearTimeout(debounceTimer)
		}

		debounceTimer = setTimeout(async () => {
			console.log(chalk.blue('\nChange detected, rebuilding...'))
			await runRender(inputFile, inputPath, options, cwd, store)
		}, 150)
	})

	process.on('SIGINT', async () => {
		console.log('')
		console.log('Stopped watching.')
		await watcher.close()
		process.exit(0)
	})
}
