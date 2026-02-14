/**
 * Shared types and constants for the page-fit module.
 */

// ── Dimensions ─────────────────────────────────────────────────────────────

/** A4 at 96 DPI */
export const A4_WIDTH_PX = 794
export const A4_HEIGHT_PX = 1123

export const PT_TO_PX = 96 / 72
export const IN_TO_PX = 96

// ── Variable ranges ────────────────────────────────────────────────────────

/** A single adjustable CSS variable with its allowed range. */
export interface VariableRange {
	key: string
	original: number
	minimum: number
	/**
	 * Shrink curve exponent. Controls how fast this variable responds to the knob.
	 *   power < 1 → shrinks early (spacing: 0.5)
	 *   power = 1 → linear (margins: 1.0)
	 *   power > 1 → resists change (typography: 2.0)
	 * Defaults to 1.0 if omitted.
	 */
	power?: number
	unit?: 'px' | 'pt' | 'in'
}

/** Universal readability minimums (theme-independent). */
export const MINIMUMS: {
	readonly 'bullet-gap': number
	readonly 'data-row-gap': number
	readonly 'entry-gap': number
	readonly 'section-gap': number
	readonly 'line-height': number
	readonly 'font-size': number
	readonly 'page-margin-y': number
	readonly 'page-margin-x': number
	readonly [key: string]: number
} = {
	'bullet-gap': 2, // px
	'data-row-gap': 2, // px
	'entry-gap': 3, // px
	'section-gap': 2, // px
	'line-height': 1.1, // unitless
	'font-size': 9, // pt
	'page-margin-y': 0.3, // in
	'page-margin-x': 0.35, // in
}

/** CSS variable names that represent gaps between elements. */
export type GapKey = 'bullet-gap' | 'data-row-gap' | 'entry-gap' | 'section-gap'

/** Gap variable keys paired with their element count keys. */
export const GAP_ENTRIES: ReadonlyArray<{
	key: GapKey
	countKey: keyof ElementCounts
}> = [
	{ key: 'bullet-gap', countKey: 'bullets' },
	{ key: 'data-row-gap', countKey: 'dataRows' },
	{ key: 'entry-gap', countKey: 'entries' },
	{ key: 'section-gap', countKey: 'sections' },
]

/** Maximum gap expansion factor for single-page fill. */
export const MAX_FILL_FACTOR = 3

// ── Domain types ───────────────────────────────────────────────────────────

export interface ElementCounts {
	bullets: number
	dataRows: number
	entries: number
	sections: number
}

export interface FitResult {
	html: string
	adjustments: Record<string, string>
	originalPages: number
	finalPages: number
}

/** Per-element text metrics collected from the DOM for predictive layout. */
export interface TextBlockMetric {
	/** Unwrapped inline width of the text content (px). */
	textWidth: number
	/** Available width of the containing block (px). */
	containerWidth: number
	/** Current number of visual lines. */
	lines: number
	/** Height per visual line at the current font-size (px). */
	heightPerLine: number
	/** Element's computed font-size relative to body font-size. */
	fontScale: number
}

/** Aggregate text metrics snapshot for predictive height calculation. */
export interface TextMetricsSnapshot {
	blocks: TextBlockMetric[]
	/** Sum of heights from non-text elements (icons, dividers, borders). */
	fixedHeight: number
	/** Body font-size at the time of measurement (px). */
	baseFontSizePx: number
	/** Line-height at the time of measurement (unitless ratio). */
	baseLineHeight: number
	/** Page margin-x at the time of measurement (in). */
	baseMarginXIn: number
	/** A4 page width in px at 96 DPI. */
	pageWidthPx: number
}

export interface CSSVariableValues {
	'section-gap': number
	'entry-gap': number
	'bullet-gap': number
	'data-row-gap': number
	'line-height': number
	'font-size': number
	'page-margin-y': number
	'page-margin-x': number
	[key: string]: number
}

/** Everything measured from the DOM in a single pass. */
export interface PageSnapshot {
	current: CSSVariableValues
	counts: ElementCounts
	contentHeight: number
	textMetrics: TextMetricsSnapshot
	/** Calibration constant: actual height minus modeled height at original values. */
	layoutNoise: number
}
