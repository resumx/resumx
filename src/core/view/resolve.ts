import type { ViewLayer, ResolvedView } from './types.js'

const DEFAULTS: ResolvedView = {
	selects: null,
	layout: null,
	pages: null,
	bulletOrder: 'source',
	vars: {},
	style: {},
	format: 'pdf',
	output: null,
	css: null,
}

/**
 * Merge view layers into a single resolved view.
 *
 * Merge semantics per field shape:
 * - Scalars (pages, bulletOrder, format, output): later layer replaces
 * - Records (vars, style): shallow merge ({ ...lower, ...upper })
 * - Arrays (selects, layout, css): later layer replaces (no concat)
 */
export function resolveView(layers: ViewLayer[]): ResolvedView {
	let result: ResolvedView = { ...DEFAULTS, vars: {}, style: {} }

	for (const layer of layers) {
		if (layer.pages !== undefined) result.pages = layer.pages
		if (layer.bulletOrder !== undefined) result.bulletOrder = layer.bulletOrder
		if (layer.format !== undefined) result.format = layer.format
		if (layer.output !== undefined) result.output = layer.output

		if (layer.vars !== undefined)
			result.vars = { ...result.vars, ...layer.vars }
		if (layer.style !== undefined)
			result.style = { ...result.style, ...layer.style }

		if (layer.selects !== undefined) result.selects = layer.selects
		if (layer.layout !== undefined) result.layout = layer.layout
		if (layer.css !== undefined) result.css = layer.css
	}

	return result
}
