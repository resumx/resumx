import type { OutputFormat } from '../renderer.js'

/**
 * A single layer in the view cascade.
 * All fields are optional because any layer may only override a subset.
 */
export interface ViewLayer {
	selects?: string[]
	layout?: string[]
	pages?: number
	bulletOrder?: 'source' | 'tag'
	vars?: Record<string, string>
	style?: Record<string, string>
	format?: OutputFormat
	output?: string
	css?: string[]
}

/**
 * The fully resolved view after merging all layers.
 * Every field has a concrete value (defaults filled in).
 */
export interface ResolvedView {
	selects: string[] | null
	layout: string[] | null
	pages: number | null
	bulletOrder: 'source' | 'tag'
	vars: Record<string, string>
	style: Record<string, string>
	format: OutputFormat
	output: string | null
	css: string[] | null
}
