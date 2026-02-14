/**
 * Predictive layout model.
 *
 * Estimates how tall the resume would be at a given set of CSS values,
 * without actually rendering it in a browser. The solver calls these
 * functions thousands of times during binary search, so they must be
 * pure arithmetic (no DOM, no Playwright).
 */

import type {
	TextMetricsSnapshot,
	PageSnapshot,
	CSSVariableValues,
} from './types.js'
import { A4_HEIGHT_PX, IN_TO_PX, PT_TO_PX, GAP_ENTRIES } from './types.js'

/**
 * Estimate the pixel height of all text content at a new font size,
 * line height, and horizontal margin.
 *
 * Core idea: bigger font = wider text = more line wraps = taller block.
 * For each text block we scale its measured text width by the font ratio,
 * re-wrap it into the (possibly narrower) container, and sum up the
 * resulting line heights. Fixed-height elements (icons, images, etc.)
 * are added unchanged at the end.
 */
export function predictHeight(
	metrics: TextMetricsSnapshot,
	newFontSizePx: number,
	newLineHeight: number,
	newMarginXIn?: number,
): number {
	// e.g. going from 16px to 12px means fontRatio = 0.75 (text is 75% as wide)
	const fontRatio = newFontSizePx / metrics.baseFontSizePx
	const lhRatio = newLineHeight / metrics.baseLineHeight

	// Margins eat into the page from both sides (left + right).
	// e.g. margins grow by 0.25in -> each side loses 24px -> container shrinks by 48px
	const marginXIn = newMarginXIn ?? metrics.baseMarginXIn
	const marginDeltaPx = (marginXIn - metrics.baseMarginXIn) * IN_TO_PX
	const containerWidthDelta = -2 * marginDeltaPx

	let totalHeight = 0

	for (const block of metrics.blocks) {
		// If a paragraph was 800px of text at the original font size,
		// at 75% font it's only 600px of text.
		const scaledTextWidth = block.textWidth * fontRatio

		// The box it flows into might also be narrower (from margin changes).
		const newContainerWidth = Math.max(
			1,
			block.containerWidth + containerWidthDelta,
		)

		// 600px of text in a 400px box = ceil(600/400) = 2 lines
		const predictedLines = Math.max(
			1,
			Math.ceil(scaledTextWidth / newContainerWidth),
		)

		// Each line is also shorter: smaller font + tighter line-height
		const newHeightPerLine = block.heightPerLine * fontRatio * lhRatio

		// This block's total height = lines * height per line
		totalHeight += predictedLines * newHeightPerLine
	}

	// Icons, images, HRs, etc. don't reflow, their height is constant
	totalHeight += metrics.fixedHeight
	return totalHeight
}

/**
 * Full height prediction used by the solver's `fits` callback.
 *
 * Adds up three components:
 *   1. Text height (from `predictHeight`)
 *   2. Gap height (section gaps, entry gaps, etc. multiplied by their counts)
 *   3. Layout noise (a small fudge factor for things the model can't predict)
 */
export function predictTotalHeight(
	snapshot: PageSnapshot,
	values: CSSVariableValues,
): number {
	const { textMetrics, counts, layoutNoise } = snapshot

	// Convert candidate values to the units predictHeight expects
	const fsPx = values['font-size'] * PT_TO_PX
	const lh = values['line-height']
	const mxIn = values['page-margin-x']

	// 1. Text height from re-wrapping prediction
	const textHeight = predictHeight(textMetrics, fsPx, lh, mxIn)

	// 2. Gaps: each gap type * how many of that element exist
	// ⚠️ FLAGGED: assumes gap savings are linear. With margin collapsing in CSS,
	// reducing a gap below the collapsing neighbor's margin has zero effect.
	// Switching to CSS gap (flex/grid) in base.css eliminates this, but
	// section-gap still uses margins. The layoutNoise calibration absorbs
	// the error at t=0, but diverges as gaps shrink toward minimums.
	let gapHeight = 0
	for (const { key, countKey } of GAP_ENTRIES) {
		gapHeight += values[key] * counts[countKey]
	}

	// 3. Layout noise covers rounding, borders, padding, etc.
	return textHeight + gapHeight + layoutNoise
}

/**
 * How many pixels of content can fit across N pages, after subtracting
 * top and bottom margins from each page.
 */
export function pageCapacity(marginYIn: number, targetPages: number): number {
	return (A4_HEIGHT_PX - 2 * marginYIn * IN_TO_PX) * targetPages
}
