import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, relative, basename, join } from 'node:path'
import { performance } from 'node:perf_hooks'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { requireDependencies } from '../lib/check.js'
import { resolveTheme } from '../lib/themes.js'
import { config, type ConfigStore } from '../lib/config.js'
import { parseStyleFlags } from './utils/style-flags.js'
import { mergeVariables } from '../lib/themes.js'
import {
	renderMultiple,
	getOutputName,
	extractNameFromContent,
	stripDocExtension,
	cleanupPath,
	type OutputFormat,
} from '../lib/renderer.js'
import { parseFrontmatterFromString } from '../lib/frontmatter.js'
import { renderMarkdown } from '../lib/markdown.js'
import { extractRoles, resolveRoles } from '../lib/roles.js'
import { extractLangs, resolveLangs } from '../lib/langs.js'
import { cartesian } from '../lib/cartesian.js'
import {
	validateTemplateVars,
	expandTemplate,
	validateTemplateUniqueness,
} from '../lib/template.js'

/**
 * Resolve which themes to use (CLI > Frontmatter > Global default)
 * Returns array of theme names
 */
function resolveThemes(
	cliThemes: string[] | undefined,
	frontmatterThemes: string[] | undefined,
	defaultTheme: string,
): string[] {
	// CLI takes precedence
	if (cliThemes && cliThemes.length > 0) {
		return cliThemes
	}

	// Frontmatter themes
	if (frontmatterThemes && frontmatterThemes.length > 0) {
		return frontmatterThemes
	}

	// Global default
	return [defaultTheme]
}

export interface RenderCommandOptions {
	theme?: string[]
	output?: string
	style?: string[]
	role?: string[]
	lang?: string[]
	format?: string[]
	watch?: boolean
	pages?: number
}

const VALID_FORMATS: OutputFormat[] = ['pdf', 'html', 'docx', 'png']

/**
 * Determine which formats to render based on CLI options
 */
function resolveFormats(options: RenderCommandOptions): OutputFormat[] {
	if (options.format && options.format.length > 0) {
		for (const f of options.format) {
			if (!VALID_FORMATS.includes(f as OutputFormat)) {
				throw new Error(
					`Unknown format: '${f}'. Valid formats: ${VALID_FORMATS.join(', ')}`,
				)
			}
		}

		return options.format as OutputFormat[]
	}

	// Default to PDF
	return ['pdf']
}

function formatDuration(ms: number): string {
	if (ms < 1000) {
		return `${Math.round(ms)}ms`
	}

	const seconds = ms / 1000
	if (seconds < 60) {
		return `${seconds.toFixed(2)}s`
	}

	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = seconds - minutes * 60
	return `${minutes}m ${remainingSeconds.toFixed(1)}s`
}

/**
 * Render task representing a single (theme, role, lang) combination
 */
interface RenderTask {
	themeName: string
	cssPath: string
	variables: Record<string, string>
	outputDir: string
	outputName: string
	activeRole: string | undefined
	activeLang: string | undefined
	label: string
}

/**
 * Build render tasks for all theme × role × lang combinations
 *
 * Output filename: {name}-{role}-{lang}-{theme}.{format}
 * Each dimension is included as a suffix only when it has multiple values.
 * Suffixes are always in fixed order: role, lang, theme.
 */
function buildRenderTasks(
	themes: Array<{
		name: string
		cssPath: string
		variables: Record<string, string>
	}>,
	roles: string[],
	langs: string[],
	baseOutputDir: string,
	baseOutputName: string,
): RenderTask[] {
	const tasks: RenderTask[] = []
	const hasMultipleRoles = roles.length > 1
	const hasMultipleLangs = langs.length > 1
	const hasMultipleThemes = themes.length > 1

	const effectiveRoles: Array<string | undefined> =
		roles.length > 0 ? roles : [undefined]
	const effectiveLangs: Array<string | undefined> =
		langs.length > 0 ? langs : [undefined]

	for (const [theme, role, lang] of cartesian(
		themes,
		effectiveRoles,
		effectiveLangs,
	)) {
		// Build suffix in fixed order: role, lang, theme
		const suffixParts = [
			hasMultipleRoles && role,
			hasMultipleLangs && lang,
			hasMultipleThemes && theme.name,
		].filter(Boolean) as string[]

		const labelParts = [
			hasMultipleRoles && role && `role: ${role}`,
			hasMultipleLangs && lang && `lang: ${lang}`,
			hasMultipleThemes && `theme: ${theme.name}`,
		].filter(Boolean) as string[]

		const outputName =
			suffixParts.length > 0 ?
				`${baseOutputName}-${suffixParts.join('-')}`
			:	baseOutputName

		tasks.push({
			themeName: theme.name,
			cssPath: theme.cssPath,
			variables: theme.variables,
			outputDir: baseOutputDir,
			outputName,
			activeRole: role,
			activeLang: lang,
			label: labelParts.length > 0 ? `[${labelParts.join(', ')}]` : '',
		})
	}

	return tasks
}

/**
 * Read all of stdin into a string
 */
async function readStdin(): Promise<string> {
	const chunks: Buffer[] = []
	for await (const chunk of process.stdin) {
		chunks.push(Buffer.from(chunk as Buffer))
	}
	return Buffer.concat(chunks).toString('utf-8')
}

/**
 * Context for a render cycle — provides metadata the renderer can't
 * derive from the raw content alone.
 */
interface RenderContext {
	/** Display label for the log line (e.g. "resume.md" or "stdin") */
	label: string
	/** Fallback output name when frontmatter doesn't specify one */
	defaultOutputName: string
}

/**
 * Run a single render cycle
 */
async function runRender(
	rawContent: string,
	options: RenderCommandOptions,
	cwd: string,
	context: RenderContext,
	store: ConfigStore = config,
): Promise<boolean> {
	const renderStart = performance.now()

	// Parse frontmatter
	const {
		config: fmConfig,
		content,
		warnings,
	} = parseFrontmatterFromString(rawContent)

	// Display warnings for unknown frontmatter fields
	for (const warning of warnings) {
		console.warn(chalk.yellow(`Warning: ${warning}`))
	}

	// Resolve themes (CLI > Frontmatter > Global default)
	const themeNames = resolveThemes(
		options.theme,
		fmConfig?.themes,
		store.defaultTheme,
	)

	// Resolve each theme to CSS path and variables
	const themes: Array<{
		name: string
		cssPath: string
		variables: Record<string, string>
	}> = []
	for (const themeName of themeNames) {
		let cssPath: string
		try {
			cssPath = resolveTheme(themeName, cwd)
		} catch (error) {
			console.error(chalk.red(`Error: ${(error as Error).message}`))
			return false
		}

		// Merge style overrides (CLI > Frontmatter > Global theme defaults)
		const globalThemeStyles = store.getThemeStyles(themeName)
		const cliStyles = options.style ? parseStyleFlags(options.style) : undefined
		const variables = mergeVariables(
			globalThemeStyles,
			fmConfig?.style,
			cliStyles,
		)

		themes.push({ name: themeName, cssPath, variables })
	}

	// Determine output (CLI > Frontmatter > defaults)
	const outputString = options.output ?? fmConfig?.output
	let baseOutputName = context.defaultOutputName
	let baseOutputDir = cwd
	let outputTemplate: string | undefined

	if (outputString) {
		try {
			validateTemplateVars(outputString, ['theme', 'role', 'lang'])
		} catch (error) {
			console.error(chalk.red(`Error: ${(error as Error).message}`))
			return false
		}

		if (outputString.endsWith('/')) {
			// Directory: use as output dir, keep default name
			baseOutputDir = resolve(cwd, outputString.slice(0, -1) || '.')
		} else if (/\{[^}]+\}/.test(outputString)) {
			// Template: expand per theme × role combination
			outputTemplate = outputString
		} else {
			// Plain name: split into dir + name
			const resolved = resolve(cwd, outputString)
			baseOutputDir = dirname(resolved)
			baseOutputName = stripDocExtension(basename(resolved))
		}
	}

	// Get formats to render (CLI > default)
	let formats: OutputFormat[]
	try {
		formats = resolveFormats(options)
	} catch (error) {
		console.error(chalk.red(`Error: ${(error as Error).message}`))
		return false
	}

	// Check dependencies
	// Only pdf2docx is required for DOCX output (PDF uses bundled Playwright Chromium)
	const needsDocx = formats.includes('docx')
	try {
		requireDependencies({ docx: needsDocx })
	} catch (error) {
		console.error(chalk.red(`Error: ${(error as Error).message}`))
		return false
	}

	// Resolve target pages (CLI > Frontmatter)
	const targetPages = options.pages ?? fmConfig?.pages

	console.log(`Building resume from: ${chalk.cyan(context.label)}\n`)

	// Discover roles and languages from content (render markdown first to get HTML)
	const html = renderMarkdown(content)
	const discoveredRoles = extractRoles(html)
	const discoveredLangs = extractLangs(html)

	// Resolve which roles to generate (priority: CLI > discovered)
	let rolesToGenerate: string[]
	try {
		rolesToGenerate = resolveRoles({
			explicit: options.role,
			discovered: discoveredRoles,
		})
	} catch (error) {
		console.error(chalk.red(`Error: ${(error as Error).message}`))
		return false
	}

	// Resolve which languages to generate (priority: CLI > discovered)
	let langsToGenerate: string[]
	try {
		langsToGenerate = resolveLangs(options.lang ?? [], discoveredLangs)
	} catch (error) {
		console.error(chalk.red(`Error: ${(error as Error).message}`))
		return false
	}

	// Build render tasks for all theme × role combinations
	let renderTasks: RenderTask[]

	if (outputTemplate) {
		try {
			validateTemplateUniqueness(outputTemplate, {
				theme: themes.map(t => t.name),
				role: rolesToGenerate,
				lang: langsToGenerate,
			})
		} catch (error) {
			console.error(chalk.red(`Error: ${(error as Error).message}`))
			return false
		}

		renderTasks = []
		const effectiveRoles: Array<string | undefined> =
			rolesToGenerate.length > 0 ? rolesToGenerate : [undefined]
		const effectiveLangs: Array<string | undefined> =
			langsToGenerate.length > 0 ? langsToGenerate : [undefined]

		for (const [theme, role, lang] of cartesian(
			themes,
			effectiveRoles,
			effectiveLangs,
		)) {
			const expanded = cleanupPath(
				expandTemplate(outputTemplate, {
					theme: theme.name,
					role: role ?? '',
					lang: lang ?? '',
				}),
			)
			const resolved = resolve(cwd, expanded)
			const labelParts: string[] = []
			if (themes.length > 1) labelParts.push(`theme: ${theme.name}`)
			if (role) labelParts.push(`role: ${role}`)
			if (lang) labelParts.push(`lang: ${lang}`)

			renderTasks.push({
				themeName: theme.name,
				cssPath: theme.cssPath,
				variables: theme.variables,
				outputDir: dirname(resolved),
				outputName: stripDocExtension(basename(resolved)),
				activeRole: role,
				activeLang: lang,
				label: labelParts.length > 0 ? `[${labelParts.join(', ')}]` : '',
			})
		}
	} else {
		renderTasks = buildRenderTasks(
			themes,
			rolesToGenerate,
			langsToGenerate,
			baseOutputDir,
			baseOutputName,
		)
	}

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
				activeRole: task.activeRole,
				activeLang: task.activeLang,
				targetPages,
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

	const renderDuration = formatDuration(performance.now() - renderStart)
	if (allSuccess) {
		console.log(
			`${chalk.green('Done!')} ${chalk.gray(`(Time: ${renderDuration})`)}`,
		)
	} else {
		console.log(
			`${chalk.red('Some formats failed to render. ')} ${chalk.gray(`(Time: ${renderDuration})`)}`,
		)
	}

	return allSuccess
}

/**
 * Detect whether stdin should be used as input
 *
 * stdin is used when:
 * - The file argument is explicitly `-`
 * - stdin is piped (!process.stdin.isTTY) and no explicit file argument was given
 *   (Commander sets file to undefined when no positional arg is provided)
 */
function isStdinInput(file: string | undefined): boolean {
	return file === '-' || (file === undefined && !process.stdin.isTTY)
}

/**
 * Main render command handler
 */
export async function renderCommand(
	inputFile: string | undefined,
	options: RenderCommandOptions,
	store: ConfigStore = config,
): Promise<void> {
	const cwd = process.cwd()

	// Stdin path: read from pipe or explicit `-`
	if (isStdinInput(inputFile)) {
		if (options.watch) {
			console.error(chalk.red('Error: --watch cannot be used with stdin input'))
			process.exit(1)
		}

		const rawContent = await readStdin()
		const nameFromContent = extractNameFromContent(rawContent)
		const outputOverride = options.output && !options.output.endsWith('/')

		if (!nameFromContent && !outputOverride) {
			console.error(
				chalk.red(
					'Error: Cannot determine output filename from stdin (no h1 heading found). Use -o to specify.',
				),
			)
			process.exit(1)
		}

		const context: RenderContext = {
			label: 'stdin',
			defaultOutputName: nameFromContent ?? '',
		}
		const success = await runRender(rawContent, options, cwd, context, store)
		process.exit(success ? 0 : 1)
	}

	// File path (existing behavior)
	const file = inputFile ?? 'resume.md'
	const inputPath = resolve(cwd, file)

	if (!existsSync(inputPath)) {
		console.error(chalk.red(`Error: Input file not found: ${inputPath}`))
		process.exit(1)
	}

	const context: RenderContext = {
		label: relative(cwd, inputPath),
		defaultOutputName: getOutputName(inputPath),
	}

	// Read file content and resolve watch paths
	const rawContent = readFileSync(inputPath, 'utf-8')
	const { config: fmConfig } = parseFrontmatterFromString(rawContent)
	const themeNamesForWatch = resolveThemes(
		options.theme,
		fmConfig?.themes,
		store.defaultTheme,
	)

	// Collect CSS paths for all themes
	const cssPaths: string[] = []
	for (const themeName of themeNamesForWatch) {
		try {
			const cssPath = resolveTheme(themeName, cwd)
			if (existsSync(cssPath)) {
				cssPaths.push(cssPath)
			}
		} catch {
			// Will error during render if theme not found
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
	const success = await runRender(rawContent, options, cwd, context, store)

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
			const freshContent = readFileSync(inputPath, 'utf-8')
			await runRender(freshContent, options, cwd, context, store)
		}, 150)
	})

	process.on('SIGINT', async () => {
		console.log('')
		console.log('Stopped watching.')
		await watcher.close()
		process.exit(0)
	})
}
