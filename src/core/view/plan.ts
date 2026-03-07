import { resolve, dirname, basename, join } from 'node:path'
import type { ResolvedView } from './types.js'
import type { OutputFormat } from '../renderer.js'
import { cartesian } from '../../lib/solver/cartesian.js'
import { cleanupPath, stripDocExtension } from '../renderer.js'
import { expandTemplate } from '../../lib/string-template/index.js'

export interface RenderPlan {
	view: ResolvedView
	viewName: string | undefined
	outputPath: string
	format: OutputFormat
	label: string
}

export interface NamedView {
	name: string | undefined
	view: ResolvedView
}

export type OutputStrategy =
	| { dir: string; name: string }
	| { template: string; cwd: string }
	| { templateDir: string; name: string; cwd: string }

/**
 * Expand pre-resolved named views across langs × formats into a flat list of
 * render plans. Each named view carries a fully resolved view (selects, sections,
 * pages, etc. already merged via the cascade).
 *
 * Output path is determined by the strategy:
 * - `{ dir, name }`: suffix-based naming, e.g. `dir/name-frontend-en.pdf`
 * - `{ template, cwd }`: template expansion, e.g. `output/{view}-{lang}.pdf`
 */
export function planRenders(
	namedViews: NamedView[],
	langs: string[],
	formats: OutputFormat[],
	output: OutputStrategy,
): RenderPlan[] {
	const plans: RenderPlan[] = []
	const isTemplate = 'template' in output
	const isTemplateDir = 'templateDir' in output
	const hasMultipleViews = namedViews.length > 1
	const hasMultipleLangs = langs.length > 1

	const effectiveLangs: Array<string | undefined> =
		langs.length > 0 ? langs : [undefined]

	for (const [namedView, lang] of cartesian(namedViews, effectiveLangs)) {
		const viewName = namedView.name
		const displayViewName =
			viewName ?? (hasMultipleViews ? 'default' : undefined)
		const showLang = isTemplate ? !!lang : hasMultipleLangs && !!lang

		const labelParts = [displayViewName, showLang && lang].filter(
			Boolean,
		) as string[]
		const label = labelParts.length > 0 ? `[${labelParts.join(', ')}]` : ''

		const resolved: ResolvedView = {
			...namedView.view,
			lang: lang ?? namedView.view.lang,
		}

		if (isTemplate) {
			for (const format of formats) {
				const expanded = cleanupPath(
					expandTemplate(output.template, {
						view: viewName ?? 'default',
						lang: lang ?? '',
						format,
					}),
				)
				const resolvedPath = resolve(output.cwd, expanded)
				const outputDir = dirname(resolvedPath)
				const outputName = stripDocExtension(basename(resolvedPath))
				plans.push({
					view: resolved,
					viewName,
					outputPath: join(outputDir, `${outputName}.${format}`),
					format,
					label,
				})
			}
		} else {
			const suffixParts = [viewName, hasMultipleLangs && lang].filter(
				Boolean,
			) as string[]
			const baseName =
				isTemplateDir ? output.name : (output as { name: string }).name
			const outputName =
				suffixParts.length > 0 ?
					`${baseName}-${suffixParts.join('-')}`
				:	baseName

			if (isTemplateDir) {
				for (const format of formats) {
					const expandedDir = cleanupPath(
						expandTemplate(output.templateDir, {
							view: viewName ?? 'default',
							lang: lang ?? '',
							format,
						}),
					)
					plans.push({
						view: resolved,
						viewName,
						outputPath: join(
							resolve(output.cwd, expandedDir),
							`${outputName}.${format}`,
						),
						format,
						label,
					})
				}
			} else {
				for (const format of formats) {
					plans.push({
						view: resolved,
						viewName,
						outputPath: join(output.dir, `${outputName}.${format}`),
						format,
						label,
					})
				}
			}
		}
	}

	return plans
}
