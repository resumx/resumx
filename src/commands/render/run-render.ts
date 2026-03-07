import { resolve, dirname, basename } from 'node:path'
import { performance } from 'node:perf_hooks'
import chalk from 'chalk'
import { requireDependencies } from '../../lib/check.js'
import { parseStyleFlags } from '../utils/style-flags.js'
import { generateHtml } from '../../core/html-generator.js'
import {
	writeOutput,
	stripDocExtension,
	type OutputFormat,
	type RenderResult,
} from '../../core/renderer.js'
import { fitToPages } from '../../core/page-fit/index.js'
import {
	planRenders,
	type RenderPlan,
	type NamedView,
} from '../../core/view/plan.js'
import { reportResults } from '../utils/report.js'
import type { DocumentContext } from '../../core/types.js'
import {
	extractTagMap,
	type FrontmatterConfig,
	type ParseResult,
} from '../../core/frontmatter.js'
import { renderMarkdown } from '../../core/markdown.js'
import {
	extractBySelector,
	resolveValues,
} from '../../lib/dom-kit/content-filter.js'
import {
	validateTemplateVars,
	validateTemplateUniqueness,
} from '../../lib/string-template/index.js'
import { extractTagNames } from '../../core/target-composition.js'
import { runCheck, printCheckResults } from '../check.js'
import { resolveView } from '../../core/view/resolve.js'
import {
	extractTagViews,
	resolveForValue,
	validateTagComposition,
} from '../../core/view/resolve-for.js'
import { loadAllViews } from '../../core/view/load.js'
import { validateHidePinOverlap } from '../../core/section-types.js'
import type { ViewLayer } from '../../core/view/types.js'
import {
	computeAffectedViews,
	type RenderScope,
} from '../../core/view/affected-views.js'
import {
	resolveFormats,
	type RenderCommandOptions,
	type RenderContext,
} from './types.js'

export async function runRender(
	parsed: Extract<ParseResult, { ok: true }>,
	options: RenderCommandOptions,
	cwd: string,
	context: RenderContext,
	renderScope: RenderScope = { type: 'full' },
): Promise<void> {
	const renderStart = performance.now()

	const { config: fmConfig, content, warnings } = parsed
	for (const warning of warnings) {
		console.warn(chalk.yellow(`Warning: ${warning}`))
	}

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

	console.log(`Building resume from: ${chalk.cyan(context.label)}\n`)

	const html = renderMarkdown(content)
	const discoveredTargets = extractBySelector(html, '[class*="@"]', el =>
		extractTagNames(el.getAttribute('class') ?? ''),
	)
	const discoveredLangs = extractBySelector(html, '[lang]', el => {
		const v = el.getAttribute('lang')
		return v ? [v] : []
	})

	const tagMap = extractTagMap(fmConfig?.tags)
	const tagViews = extractTagViews(fmConfig?.tags)

	if (Object.keys(tagMap).length > 0) {
		validateTagComposition(tagMap, discoveredTargets)
	}

	const customViews = loadAllViews(context.cssBaseDir)

	const forFlags = options.for ?? []

	const langsToGenerate = resolveValues(
		options.lang ?? [],
		discoveredLangs,
		'language',
	)

	const namedViews: NamedView[] = []

	if (forFlags.length > 0) {
		if (forFlags.includes('*')) {
			const view = resolveView([defaultView, ephemeralView])
			const overlapError = validateHidePinOverlap(
				view.sections.hide,
				view.sections.pin,
			)
			if (overlapError) throw new Error(overlapError)
			namedViews.push({ name: undefined, view })
		}

		for (const forValue of forFlags) {
			const resolved = resolveForValue(
				forValue,
				tagViews,
				customViews,
				discoveredTargets,
			)
			for (const { name, layer } of resolved) {
				const view = resolveView([defaultView, layer, ephemeralView])

				const overlapError = validateHidePinOverlap(
					view.sections.hide,
					view.sections.pin,
				)
				if (overlapError) throw new Error(overlapError)

				if (
					name === undefined
					&& namedViews.some(nv => nv.name === undefined)
				) {
					continue
				}
				namedViews.push({ name, view })
			}
		}
	} else {
		const view = resolveView([defaultView, ephemeralView])

		const overlapError = validateHidePinOverlap(
			view.sections.hide,
			view.sections.pin,
		)
		if (overlapError) throw new Error(overlapError)

		namedViews.push({ name: undefined, view })
	}

	const firstView = namedViews[0]!.view
	let baseOutputName = context.defaultOutputName
	let baseOutputDir = cwd
	let outputTemplate: string | undefined
	let outputTemplateDir: string | undefined

	if (firstView.output) {
		validateTemplateVars(firstView.output, ['view', 'lang', 'format'])

		const hasTemplateVars = /\{[^}]+\}/.test(firstView.output)
		if (hasTemplateVars && firstView.output.endsWith('/')) {
			outputTemplateDir = firstView.output.slice(0, -1) || '.'
		} else if (hasTemplateVars) {
			outputTemplate = firstView.output
		} else if (firstView.output.endsWith('/')) {
			baseOutputDir = resolve(cwd, firstView.output.slice(0, -1) || '.')
		} else {
			const resolved = resolve(cwd, firstView.output)
			baseOutputDir = dirname(resolved)
			baseOutputName = stripDocExtension(basename(resolved))
		}
	}

	const formats = resolveFormats(options)

	const needsDocx = formats.includes('docx')
	requireDependencies({ docx: needsDocx })

	if (outputTemplate) {
		const viewNames = namedViews
			.map(nv => nv.name)
			.filter((n): n is string => !!n)
		validateTemplateUniqueness(outputTemplate, {
			view: viewNames,
			lang: langsToGenerate,
		})
	}

	const outputStrategy =
		outputTemplate ? { template: outputTemplate, cwd }
		: outputTemplateDir ?
			{ templateDir: outputTemplateDir, name: baseOutputName, cwd }
		:	{ dir: baseOutputDir, name: baseOutputName }

	const plans = planRenders(
		namedViews,
		langsToGenerate,
		formats,
		outputStrategy,
	)

	let plansToExecute = plans

	if (renderScope?.type === 'views') {
		plansToExecute = plans.filter(
			p => p.viewName !== undefined && renderScope.names.has(p.viewName),
		)
	} else if (renderScope?.type === 'changedTags') {
		const affected = computeAffectedViews(renderScope.names, tagMap, namedViews)
		plansToExecute = plans.filter(
			p => p.viewName !== undefined && affected.has(p.viewName),
		)
	}

	if (plansToExecute.length === 0) return

	const hasTagMap = Object.keys(tagMap).length > 0
	const doc: DocumentContext = {
		content,
		icons: fmConfig?.icons,
		tagMap: hasTagMap ? tagMap : undefined,
		contentTags: discoveredTargets,
		baseDir: context.cssBaseDir,
	}

	const plansByLabel = new Map<string, RenderPlan[]>()
	for (const plan of plansToExecute) {
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

export async function handleCheck(
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
