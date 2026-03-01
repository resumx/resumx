import type { OutputFormat } from '../renderer.js'
import type { SectionType } from '../section-types.js'

export type BulletOrder = 'none' | 'tag'

export interface SectionsConfig {
	hide?: SectionType[]
	pin?: SectionType[]
}

/**
 * A single layer in the view cascade.
 * All fields are optional because any layer may only override a subset.
 */
export interface ViewLayer {
	selects?: string[]
	sections?: SectionsConfig
	pages?: number
	bulletOrder?: BulletOrder
	vars?: Record<string, string>
	style?: Record<string, string>
	format?: OutputFormat
	output?: string
	css?: string[]
	lang?: string
}

/**
 * The fully resolved view after merging all layers.
 * Every field has a concrete value (defaults filled in).
 */
export interface ResolvedView {
	selects: string[] | null
	sections: Required<SectionsConfig>
	pages: number | null
	bulletOrder: BulletOrder
	vars: Record<string, string>
	style: Record<string, string>
	format: OutputFormat
	output: string | null
	css: string[] | null
	lang: string | null
}
