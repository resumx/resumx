import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, relative, basename, isAbsolute } from 'node:path'
import { performance } from 'node:perf_hooks'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { requireDependencies } from '../lib/check.js'
import { mergeVariables, DEFAULT_STYLESHEET } from '../core/styles.js'
import { parseStyleFlags } from './utils/style-flags.js'
import {
	renderMultiple,
	getOutputName,
	extractNameFromContent,
	stripDocExtension,
	cleanupPath,
	type OutputFormat,
} from '../core/renderer.js'
import {
	parseFrontmatterFromString,
	type FrontmatterConfig,
	type ParseResult,
} from '../core/frontmatter.js'
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
 * Resolve CSS file paths (CLI > Frontmatter > default).
 * The default stylesheet is always included first, user CSS cascades on top.
 * Paths resolve relative to the markdown file's directory.
 */
function resolveCssPaths(
	cliCss: string[] | undefined,
	frontmatterCss: string[] | undefined,
	baseDir: string,
): string[] {
	const raw =
		cliCss && cliCss.length > 0 ? cliCss
		: frontmatterCss && frontmatterCss.length > 0 ? frontmatterCss
		: null

	if (!raw) return [DEFAULT_STYLESHEET]

	const userPaths = raw.map(p => {
		const absolutePath = isAbsolute(p) ? p : resolve(baseDir, p)
		if (!existsSync(absolutePath)) {
			throw new Error(`CSS file not found: ${absolutePath}`)
		}
		return absolutePath
	})

	return [DEFAULT_STYLESHEET, ...userPaths]
}

export interface RenderCommandOptions {
	css?: string[]
	output?: string
	style?: string[]
	var?: Record<string, string>
	for?: string[]
	lang?: string[]
	format?: string[]
	watch?: boolean
	pages?: number
	check?: boolean
	strict?: boolean
	minSeverity?: Severity
}

const VALID_FORMATS: OutputFormat[] = ['pdf', 'html', 'docx', 'png']

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

interface RenderTask {
	cssPaths: string[]
	variables: Record<string, string>
	outputDir: string
	outputName: string
	activeTarget: string | undefined
	activeLang: string | undefined
	label: string
}

/**
 * Build render tasks for all target × lang combinations.
 *
 * Output filename: {name}-{target}-{lang}.{format}
 * Each dimension is included as a suffix only when it has multiple values.
 */
function buildRenderTasks(
	cssPaths: string[],
	variables: Record<string, string>,
	targets: string[],
	langs: string[],
	baseOutputDir: string,
	baseOutputName: string,
): RenderTask[] {
	const tasks: RenderTask[] = []
	const hasMultipleTargets = targets.length > 1
	const hasMultipleLangs = langs.length > 1

	const effectiveTargets: Array<string | undefined> =
		targets.length > 0 ? targets : [undefined]
	const effectiveLangs: Array<string | undefined> =
		langs.length > 0 ? langs : [undefined]

	for (const [target, lang] of cartesian(effectiveTargets, effectiveLangs)) {
		const suffixParts = [
			hasMultipleTargets && target,
			hasMultipleLangs && lang,
		].filter(Boolean) as string[]

		const labelParts = [
			hasMultipleTargets && target,
			hasMultipleLangs && lang,
		].filter(Boolean) as string[]

		const outputName =
			suffixParts.length > 0 ?
				`${baseOutputName}-${suffixParts.join('-')}`
			:	baseOutputName

		tasks.push({
			cssPaths,
			variables,
			outputDir: baseOutputDir,
			outputName,
			activeTarget: target,
			activeLang: lang,
			label: labelParts.length > 0 ? `[${labelParts.join(', ')}]` : '',
		})
	}

	return tasks
}

async function readStdin(): Promise<string> {
	const chunks: Buffer[] = []
	for await (const chunk of process.stdin) {
		chunks.push(Buffer.from(chunk as Buffer))
	}
	return Buffer.concat(chunks).toString('utf-8')
}

interface RenderContext {
	label: string
	defaultOutputName: string
	/** Directory for resolving relative CSS paths (markdown file's dir, or cwd for stdin) */
	cssBaseDir: string
}

async function runRender(
	parsed: Extract<ParseResult, { ok: true }>,
	options: RenderCommandOptions,
	cwd: string,
	context: RenderContext,
): Promise<void> {
	const renderStart = performance.now()

	const { config: fmConfig, content, warnings } = parsed
	for (const warning of warnings) {
		console.warn(chalk.yellow(`Warning: ${warning}`))
	}

	// Resolve CSS paths (CLI > Frontmatter > default), relative to markdown file
	const cssPaths = resolveCssPaths(
		options.css,
		fmConfig?.css,
		context.cssBaseDir,
	)

	// Merge style overrides (CLI > Frontmatter)
	const cliStyles = options.style ? parseStyleFlags(options.style) : undefined
	const variables = mergeVariables(fmConfig?.style, cliStyles)

	// Determine output (CLI > Frontmatter > defaults)
	const outputString = options.output ?? fmConfig?.output
	let baseOutputName = context.defaultOutputName
	let baseOutputDir = cwd
	let outputTemplate: string | undefined

	if (outputString) {
		validateTemplateVars(outputString, ['target', 'lang'])

		if (outputString.endsWith('/')) {
			baseOutputDir = resolve(cwd, outputString.slice(0, -1) || '.')
		} else if (/\{[^}]+\}/.test(outputString)) {
			outputTemplate = outputString
		} else {
			const resolved = resolve(cwd, outputString)
			baseOutputDir = dirname(resolved)
			baseOutputName = stripDocExtension(basename(resolved))
		}
	}

	const formats = resolveFormats(options)

	const needsDocx = formats.includes('docx')
	requireDependencies({ docx: needsDocx })

	const targetPages = options.pages ?? fmConfig?.pages

	const mergedVars: Record<string, string> = {
		...fmConfig?.vars,
		...options.var,
	}
	const vars = Object.keys(mergedVars).length > 0 ? mergedVars : undefined

	console.log(`Building resume from: ${chalk.cyan(context.label)}\n`)

	// Discover targets and languages from content
	const html = renderMarkdown(content)
	const TARGET_CLASS_RE = /@([^\s"']+)/g
	const discoveredTargets = extractBySelector(html, '[class*="@"]', el => {
		const cls = el.getAttribute('class') ?? ''
		TARGET_CLASS_RE.lastIndex = 0
		const targets: string[] = []
		let m
		while ((m = TARGET_CLASS_RE.exec(cls))) targets.push(m[1]!)
		return targets
	})
	const discoveredLangs = extractBySelector(html, '[lang]', el => {
		const v = el.getAttribute('lang')
		return v ? [v] : []
	})

	const tagMap = fmConfig?.tags
	const allKnownTargets =
		tagMap ?
			[...new Set([...discoveredTargets, ...Object.keys(tagMap)])]
		:	discoveredTargets

	const tagsToGenerate = resolveValues(
		options.for ?? [],
		allKnownTargets,
		'target',
	)

	const langsToGenerate = resolveValues(
		options.lang ?? [],
		discoveredLangs,
		'language',
	)

	let renderTasks: RenderTask[]

	if (outputTemplate) {
		validateTemplateUniqueness(outputTemplate, {
			target: tagsToGenerate,
			lang: langsToGenerate,
		})

		renderTasks = []
		const effectiveTargets: Array<string | undefined> =
			tagsToGenerate.length > 0 ? tagsToGenerate : [undefined]
		const effectiveLangs: Array<string | undefined> =
			langsToGenerate.length > 0 ? langsToGenerate : [undefined]

		for (const [target, lang] of cartesian(effectiveTargets, effectiveLangs)) {
			const expanded = cleanupPath(
				expandTemplate(outputTemplate, {
					target: target ?? '',
					lang: lang ?? '',
				}),
			)
			const resolved = resolve(cwd, expanded)
			const labelParts: string[] = []
			if (target) labelParts.push(target)
			if (lang) labelParts.push(lang)

			renderTasks.push({
				cssPaths,
				variables,
				outputDir: dirname(resolved),
				outputName: stripDocExtension(basename(resolved)),
				activeTarget: target,
				activeLang: lang,
				label: labelParts.length > 0 ? `[${labelParts.join(', ')}]` : '',
			})
		}
	} else {
		renderTasks = buildRenderTasks(
			cssPaths,
			variables,
			tagsToGenerate,
			langsToGenerate,
			baseOutputDir,
			baseOutputName,
		)
	}

	const taskResults = await Promise.all(
		renderTasks.map(async task => {
			const hasVariables = Object.keys(task.variables).length > 0
			const results = await renderMultiple({
				content,
				outputDir: task.outputDir,
				outputName: task.outputName,
				formats,
				cssPaths: task.cssPaths,
				variables: hasVariables ? task.variables : undefined,
				activeTarget: task.activeTarget,
				activeLang: task.activeLang,
				targetPages,
				icons: fmConfig?.icons,
				tagMap,
				vars,
			})
			return { label: task.label, results }
		}),
	)

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

function isStdinInput(file: string | undefined): boolean {
	return file === '-' || (file === undefined && !process.stdin.isTTY)
}

async function handleCheck(
	rawContent: string,
	label: string,
	options: RenderCommandOptions,
	validateConfig?: FrontmatterConfig['validate'],
): Promise<boolean> {
	const { filteredIssues, ok } = await runCheck(rawContent, {
		strict: options.strict,
		minSeverity: options.minSeverity,
		validateConfig,
	})

	printCheckResults(filteredIssues, label)

	if (options.check) {
		if (!ok) throw new Error('Validation failed')
		return false
	}

	if (options.strict && !ok) {
		throw new Error('Validation failed, skipping render (--strict)')
	}

	if (filteredIssues.length > 0) {
		console.log()
	}
	return true
}

export async function renderCommand(
	inputFile: string | undefined,
	options: RenderCommandOptions,
	cwd: string = process.cwd(),
): Promise<void> {
	const skipCheck = options.check === false

	if (options.check && options.watch) {
		throw new Error('--check cannot be used with --watch')
	}

	// Stdin path
	if (isStdinInput(inputFile)) {
		if (options.watch) {
			throw new Error('--watch cannot be used with stdin input')
		}

		const rawContent = await readStdin()
		const parsed = parseFrontmatterFromString(rawContent)
		if (!parsed.ok) {
			throw new Error(parsed.error)
		}

		if (!skipCheck) {
			const proceed = await handleCheck(
				rawContent,
				'stdin',
				options,
				parsed.config?.validate,
			)
			if (!proceed) return
		}

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
			cssBaseDir: cwd,
		}
		await runRender(parsed, options, cwd, context)
		return
	}

	// File path
	const file = inputFile ?? 'resume.md'
	const inputPath = resolve(cwd, file)

	if (!existsSync(inputPath)) {
		throw new Error(`Input file not found: ${inputPath}`)
	}

	const mdDir = dirname(inputPath)

	const context: RenderContext = {
		label: relative(cwd, inputPath),
		defaultOutputName: getOutputName(inputPath),
		cssBaseDir: mdDir,
	}

	const rawContent = readFileSync(inputPath, 'utf-8')
	const parsed = parseFrontmatterFromString(rawContent)
	if (!parsed.ok) {
		throw new Error(parsed.error)
	}

	if (!skipCheck) {
		const proceed = await handleCheck(
			rawContent,
			context.label,
			options,
			parsed.config?.validate,
		)
		if (!proceed) return
	}

	let cssPaths: string[] = []
	try {
		cssPaths = resolveCssPaths(options.css, parsed.config?.css, mdDir)
	} catch {
		// Will error during render
	}

	const watchPaths = [inputPath, ...cssPaths.filter(p => existsSync(p))]

	if (options.watch) {
		const relativeWatchPaths = watchPaths.map(p => relative(cwd, p))
		console.log(
			chalk.blue(`Watching for changes...`)
				+ ` (${relativeWatchPaths.join(', ')})`,
		)
		console.log('')
	}

	await runRender(parsed, options, cwd, context)

	if (!options.watch) return

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
				const freshParsed = parseFrontmatterFromString(freshContent)
				if (!freshParsed.ok) {
					throw new Error(freshParsed.error)
				}

				if (!skipCheck) {
					const proceed = await handleCheck(
						freshContent,
						context.label,
						options,
						freshParsed.config?.validate,
					)
					if (!proceed) return
				}

				await runRender(freshParsed, options, cwd, context)
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
