import type { ViewLayer, ResolvedView, SectionsConfig } from './types.js'

const DEFAULT_SECTIONS: Required<SectionsConfig> = {
	hide: [],
	pin: [],
}

const DEFAULTS: ResolvedView = {
	selects: null,
	sections: { ...DEFAULT_SECTIONS },
	pages: null,
	bulletOrder: 'none',
	vars: {},
	style: {},
	format: 'pdf',
	output: null,
	css: null,
	lang: null,
}

/**
 * Merge view layers into a single resolved view.
 *
 * Merge semantics per field shape:
 * - Scalars (pages, bulletOrder, format, output): later layer replaces
 * - Records (vars, style): shallow merge ({ ...lower, ...upper })
 * - Namespace (sections): each sub-field replaces independently
 * - Arrays (selects, css): later layer replaces (no concat)
 */
export function resolveView(layers: ViewLayer[]): ResolvedView {
	let result: ResolvedView = {
		...DEFAULTS,
		sections: { ...DEFAULT_SECTIONS },
		vars: {},
		style: {},
	}

	for (const layer of layers) {
		if (layer.pages !== undefined) result.pages = layer.pages
		if (layer.bulletOrder !== undefined) result.bulletOrder = layer.bulletOrder
		if (layer.format !== undefined) result.format = layer.format
		if (layer.output !== undefined) result.output = layer.output

		if (layer.vars !== undefined)
			result.vars = { ...result.vars, ...layer.vars }
		if (layer.style !== undefined)
			result.style = { ...result.style, ...layer.style }

		if (layer.sections !== undefined) {
			if (layer.sections.hide !== undefined)
				result.sections.hide = layer.sections.hide
			if (layer.sections.pin !== undefined)
				result.sections.pin = layer.sections.pin
		}

		if (layer.selects !== undefined) result.selects = layer.selects
		if (layer.css !== undefined) result.css = layer.css
		if (layer.lang !== undefined) result.lang = layer.lang
	}

	return result
}
