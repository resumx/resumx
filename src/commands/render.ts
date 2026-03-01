import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, relative, basename, join } from 'node:path'
import { performance } from 'node:perf_hooks'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { requireDependencies } from '../lib/check.js'
import { parseStyleFlags } from './utils/style-flags.js'
import { resolveCssPaths, generateHtml } from '../core/html-generator.js'
import {
	writeOutput,
	getOutputName,
	extractNameFromContent,
	stripDocExtension,
	type OutputFormat,
	type RenderResult,
} from '../core/renderer.js'
import { fitToPages } from '../core/page-fit/index.js'
import { planRenders, type RenderPlan } from '../core/view/plan.js'
import { reportResults } from './utils/report.js'
import type { DocumentContext } from '../core/types.js'
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
import {
	validateTemplateVars,
	validateTemplateUniqueness,
} from '../lib/string-template/index.js'
import { extractTagNames } from '../core/target-composition.js'
import { runCheck, printCheckResults } from './check.js'
import { resolveView } from '../core/view/resolve.js'
import {
	validateHidePinOverlap,
	type SectionType,
} from '../core/section-types.js'
import type { ViewLayer, BulletOrder } from '../core/view/types.js'
import type { Severity } from '../core/validator/types.js'

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
	hide?: SectionType[]
	pin?: SectionType[]
	bulletOrder?: BulletOrder
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

	// Build view layers: default (frontmatter) + ephemeral (CLI)
	const cliStyles = options.style ? parseStyleFlags(options.style) : undefined

	const defaultView: ViewLayer = {
		pages: fmConfig?.pages,
		sections: fmConfig?.sections,
		bulletOrder: fmConfig?.['bullet-order'],
		vars: fmConfig?.vars,
		style: fmConfig?.style,
		output: fmConfig?.output,
		css: fmConfig?.css,
	}

	const cliSections =
		options.hide || options.pin ?
			{ hide: options.hide, pin: options.pin }
		:	undefined

	const ephemeralView: ViewLayer = {
		pages: options.pages,
		sections: cliSections,
		bulletOrder: options.bulletOrder,
		vars:
			options.var && Object.keys(options.var).length > 0 ?
				options.var
			:	undefined,
		style: cliStyles,
		output: options.output,
		css: options.css && options.css.length > 0 ? options.css : undefined,
	}

	const view = resolveView([defaultView, ephemeralView])

	const overlapError = validateHidePinOverlap(
		view.sections.hide,
		view.sections.pin,
	)
	if (overlapError) throw new Error(overlapError)

	// Resolve CSS paths from the cascade result
	const cssPaths = resolveCssPaths(view.css, context.cssBaseDir)

	// Determine output path
	let baseOutputName = context.defaultOutputName
	let baseOutputDir = cwd
	let outputTemplate: string | undefined

	if (view.output) {
		validateTemplateVars(view.output, ['view', 'lang'])

		if (view.output.endsWith('/')) {
			baseOutputDir = resolve(cwd, view.output.slice(0, -1) || '.')
		} else if (/\{[^}]+\}/.test(view.output)) {
			outputTemplate = view.output
		} else {
			const resolved = resolve(cwd, view.output)
			baseOutputDir = dirname(resolved)
			baseOutputName = stripDocExtension(basename(resolved))
		}
	}

	const formats = resolveFormats(options)

	const needsDocx = formats.includes('docx')
	requireDependencies({ docx: needsDocx })

	const vars = Object.keys(view.vars).length > 0 ? view.vars : undefined

	console.log(`Building resume from: ${chalk.cyan(context.label)}\n`)

	// Discover targets and languages from content
	const html = renderMarkdown(content)
	const discoveredTargets = extractBySelector(html, '[class*="@"]', el =>
		extractTagNames(el.getAttribute('class') ?? ''),
	)
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

	if (outputTemplate) {
		validateTemplateUniqueness(outputTemplate, {
			view: tagsToGenerate,
			lang: langsToGenerate,
		})
	}

	const outputStrategy =
		outputTemplate ?
			{ template: outputTemplate, cwd }
		:	{ dir: baseOutputDir, name: baseOutputName }

	const plans = planRenders(
		view,
		cssPaths,
		view.style,
		tagsToGenerate,
		langsToGenerate,
		formats,
		outputStrategy,
	)

	const doc: DocumentContext = {
		content,
		icons: fmConfig?.icons,
		tagMap,
		baseDir: context.cssBaseDir,
	}

	const plansByLabel = new Map<string, RenderPlan[]>()
	for (const plan of plans) {
		const group = plansByLabel.get(plan.label) ?? []
		group.push(plan)
		plansByLabel.set(plan.label, group)
	}

	const taskResults = await Promise.all(
		[...plansByLabel.entries()].map(async ([label, groupPlans]) => {
			const planView = groupPlans[0]!.view
			let html = await generateHtml(doc, planView)
			if (planView.pages) {
				const fitResult = await fitToPages(html, planView.pages)
				html = fitResult.html
			}

			const results = new Map<OutputFormat, RenderResult>()
			await Promise.all(
				groupPlans.map(async plan => {
					const result = await writeOutput(html, plan.format, plan.outputPath)
					results.set(plan.format, result)
				}),
			)
			return { label, results }
		}),
	)

	reportResults(taskResults, cwd, renderStart)
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
		const resolvedCss =
			options.css && options.css.length > 0 ?
				options.css
			:	(parsed.config?.css ?? null)
		cssPaths = resolveCssPaths(resolvedCss, mdDir)
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
