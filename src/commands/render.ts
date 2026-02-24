import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, relative, basename, join } from 'node:path'
import { performance } from 'node:perf_hooks'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { requireDependencies } from '../lib/check.js'
import { resolveTheme, mergeVariables, DEFAULT_THEME } from '../core/themes.js'
import { parseStyleFlags } from './utils/style-flags.js'
import {
	renderMultiple,
	getOutputName,
	extractNameFromContent,
	stripDocExtension,
	cleanupPath,
	type OutputFormat,
} from '../core/renderer.js'
import { parseFrontmatterFromString } from '../core/frontmatter.js'
import { renderMarkdown } from '../core/markdown.js'
import {
	extractBySelector,
	resolveValues,
} from '../lib/dom-kit/content-filter.js'
import { cartesian } from '../lib/solver/cartesian.js'
import {
	validateTemplateVars,
	expandTemplate,
	validateTemplateUniqueness,
} from '../lib/string-template/index.js'
import { runCheck, printCheckResults } from './check.js'
import type { Severity } from '../core/validator/types.js'

/**
 * Resolve which themes to use (CLI > Frontmatter > default)
 * Returns array of theme names
 */
function resolveThemes(
	cliThemes: string[] | undefined,
	frontmatterThemes: string[] | undefined,
): string[] {
	// CLI takes precedence
	if (cliThemes && cliThemes.length > 0) {
		return cliThemes
	}

	// Frontmatter themes
	if (frontmatterThemes && frontmatterThemes.length > 0) {
		return frontmatterThemes
	}

	// Default
	return [DEFAULT_THEME]
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
	check?: boolean
	strict?: boolean
	minSeverity?: Severity
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
			hasMultipleRoles && role,
			hasMultipleLangs && lang,
			hasMultipleThemes && theme.name,
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
): Promise<void> {
	const renderStart = performance.now()

	// Parse frontmatter
	const parsed = parseFrontmatterFromString(rawContent)
	if (!parsed.ok) {
		throw new Error(parsed.error)
	}

	const { config: fmConfig, content, warnings } = parsed
	for (const warning of warnings) {
		console.warn(chalk.yellow(`Warning: ${warning}`))
	}

	// Resolve themes (CLI > Frontmatter > default)
	const themeNames = resolveThemes(options.theme, fmConfig?.themes)

	// Resolve each theme to CSS path and variables
	const themes: Array<{
		name: string
		cssPath: string
		variables: Record<string, string>
	}> = []
	for (const themeName of themeNames) {
		const cssPath = resolveTheme(themeName, cwd)

		// Merge style overrides (CLI > Frontmatter > Theme defaults)
		const cliStyles = options.style ? parseStyleFlags(options.style) : undefined
		const variables = mergeVariables(fmConfig?.style, cliStyles)

		themes.push({ name: themeName, cssPath, variables })
	}

	// Determine output (CLI > Frontmatter > defaults)
	const outputString = options.output ?? fmConfig?.output
	let baseOutputName = context.defaultOutputName
	let baseOutputDir = cwd
	let outputTemplate: string | undefined

	if (outputString) {
		validateTemplateVars(outputString, ['theme', 'role', 'lang'])

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
	const formats = resolveFormats(options)

	// Check dependencies
	// Only pdf2docx is required for DOCX output (PDF uses bundled Playwright Chromium)
	const needsDocx = formats.includes('docx')
	requireDependencies({ docx: needsDocx })

	// Resolve target pages (CLI > Frontmatter)
	const targetPages = options.pages ?? fmConfig?.pages

	console.log(`Building resume from: ${chalk.cyan(context.label)}\n`)

	// Discover roles and languages from content (render markdown first to get HTML)
	const html = renderMarkdown(content)
	const ROLE_CLASS_RE = /\brole:([^\s"']+)/g
	const discoveredRoles = extractBySelector(html, '[class*="role:"]', el => {
		const cls = el.getAttribute('class') ?? ''
		ROLE_CLASS_RE.lastIndex = 0
		const roles: string[] = []
		let m
		while ((m = ROLE_CLASS_RE.exec(cls))) roles.push(m[1]!)
		return roles
	})
	const discoveredLangs = extractBySelector(html, '[lang]', el => {
		const v = el.getAttribute('lang')
		return v ? [v] : []
	})

	// Merge composed role names from frontmatter into discovered set
	const roleMap = fmConfig?.roles
	const allKnownRoles =
		roleMap ?
			[...new Set([...discoveredRoles, ...Object.keys(roleMap)])]
		:	discoveredRoles

	// Resolve which roles to generate (priority: CLI > discovered + composed)
	const rolesToGenerate = resolveValues(
		options.role ?? [],
		allKnownRoles,
		'role',
	)

	// Resolve which languages to generate (priority: CLI > discovered)
	const langsToGenerate = resolveValues(
		options.lang ?? [],
		discoveredLangs,
		'language',
	)

	// Build render tasks for all theme × role combinations
	let renderTasks: RenderTask[]

	if (outputTemplate) {
		validateTemplateUniqueness(outputTemplate, {
			theme: themes.map(t => t.name),
			role: rolesToGenerate,
			lang: langsToGenerate,
		})

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
			if (role) labelParts.push(role)
			if (lang) labelParts.push(lang)
			if (themes.length > 1) labelParts.push(theme.name)

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
				icons: fmConfig?.icons,
				roleMap,
			})
			return { label: task.label, results }
		}),
	)

	// Print results — one compact line per task
	let allSuccess = true
	let totalFiles = 0
	const outputDirs = new Set<string>()

	const maxLabelWidth = Math.max(
		0,
		...taskResults.map(({ label }) => label.length),
	)

	for (const { label, results } of taskResults) {
		const formatParts: string[] = []
		const errors: string[] = []

		for (const [format, result] of results) {
			const tag = format.toUpperCase()
			if (result.success) {
				totalFiles++
				const relDir = relative(cwd, dirname(result.outputPath)) || '.'
				outputDirs.add(relDir)
				formatParts.push(`${tag} ${chalk.green('✓')}`)
			} else {
				formatParts.push(`${tag} ${chalk.red('✗')}`)
				errors.push(`${tag}: ${result.error}`)
				allSuccess = false
			}
		}

		const prefix = label ? `  ${label.padEnd(maxLabelWidth)} ` : '  '
		console.log(`${prefix}${formatParts.join('  ')}`)

		for (const err of errors) {
			console.log(chalk.red(`${''.padEnd(maxLabelWidth + 4)}${err}`))
		}
	}

	console.log('')

	const renderDuration = formatDuration(performance.now() - renderStart)
	const fileCount = `${totalFiles} file${totalFiles !== 1 ? 's' : ''}`
	const outputDir =
		outputDirs.size === 1 ?
			` \u2192 ${chalk.cyan([...outputDirs][0]!)}${[...outputDirs][0] === '.' ? '' : '/'}`
		:	''

	if (allSuccess) {
		console.log(
			`${chalk.green('Done!')} ${fileCount}${outputDir} ${chalk.gray(`(Time: ${renderDuration})`)}`,
		)
	} else {
		console.log(
			`${chalk.red('Some formats failed.')} ${chalk.gray(`(Time: ${renderDuration})`)}`,
		)
		throw new Error('Some formats failed to render')
	}
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
 * Run validation and decide whether to proceed with rendering.
 *
 * Returns true if rendering should proceed, false for --check mode (done).
 * Throws on validation failure in --check or --strict mode.
 */
async function handleCheck(
	rawContent: string,
	label: string,
	options: RenderCommandOptions,
): Promise<boolean> {
	const { filteredIssues, ok } = await runCheck(rawContent, {
		strict: options.strict,
		minSeverity: options.minSeverity,
	})

	printCheckResults(filteredIssues, label)

	if (options.check) {
		// --check: validate only, signal result
		if (!ok) throw new Error('Validation failed')
		return false // check-only mode passed, don't render
	}

	if (options.strict && !ok) {
		// --strict: block render on validation failure
		throw new Error('Validation failed, skipping render (--strict)')
	}

	// Default: warn and continue
	if (filteredIssues.length > 0) {
		console.log()
	}
	return true
}

/**
 * Main render command handler.
 *
 * Returns normally on success, throws on any failure.
 * The CLI wrapper in index.ts handles process.exit().
 */
export async function renderCommand(
	inputFile: string | undefined,
	options: RenderCommandOptions,
	cwd: string = process.cwd(),
): Promise<void> {
	const skipCheck = options.check === false

	// --check is incompatible with --watch
	if (options.check && options.watch) {
		throw new Error('--check cannot be used with --watch')
	}

	// Stdin path: read from pipe or explicit `-`
	if (isStdinInput(inputFile)) {
		if (options.watch) {
			throw new Error('--watch cannot be used with stdin input')
		}

		const rawContent = await readStdin()

		// Validation step (unless --no-check)
		if (!skipCheck) {
			const proceed = await handleCheck(rawContent, 'stdin', options)
			if (!proceed) return // --check passed, done
		}

		// --check returns above, so we only reach here for render
		const nameFromContent = extractNameFromContent(rawContent)
		const outputOverride = options.output && !options.output.endsWith('/')

		if (!nameFromContent && !outputOverride) {
			throw new Error(
				'Cannot determine output filename from stdin (no h1 heading found). Use -o to specify.',
			)
		}

		const context: RenderContext = {
			label: 'stdin',
			defaultOutputName: nameFromContent ?? '',
		}
		await runRender(rawContent, options, cwd, context)
		return
	}

	// File path (existing behavior)
	const file = inputFile ?? 'resume.md'
	const inputPath = resolve(cwd, file)

	if (!existsSync(inputPath)) {
		throw new Error(`Input file not found: ${inputPath}`)
	}

	const context: RenderContext = {
		label: relative(cwd, inputPath),
		defaultOutputName: getOutputName(inputPath),
	}

	// Read file content and resolve watch paths
	const rawContent = readFileSync(inputPath, 'utf-8')

	// Validation step (unless --no-check)
	if (!skipCheck) {
		const proceed = await handleCheck(rawContent, context.label, options)
		if (!proceed) return // --check passed, done
	}

	const parsed = parseFrontmatterFromString(rawContent)
	const fmConfig = parsed.ok ? parsed.config : null
	const themeNamesForWatch = resolveThemes(options.theme, fmConfig?.themes)

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
		const relativeWatchPaths = watchPaths.map(p => relative(cwd, p))
		console.log(
			chalk.blue(`Watching for changes...`)
				+ ` (${relativeWatchPaths.join(', ')})`,
		)
		console.log('')
	}

	// Run initial render
	await runRender(rawContent, options, cwd, context)

	if (!options.watch) return

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
			try {
				console.log(chalk.blue('\nChange detected, rebuilding...'))
				const freshContent = readFileSync(inputPath, 'utf-8')

				// Re-validate on each change (unless --no-check)
				if (!skipCheck) {
					const proceed = await handleCheck(
						freshContent,
						context.label,
						options,
					)
					if (!proceed) return
				}

				await runRender(freshContent, options, cwd, context)
			} catch (error) {
				console.log(chalk.yellow((error as Error).message ?? 'Unknown error'))
				console.log(chalk.yellow('Fix issues and save again.'))
			}
		}, 150)
	})

	process.on('SIGINT', async () => {
		console.log('')
		console.log('Stopped watching.')
		await watcher.close()
		process.exit(0)
	})
}
