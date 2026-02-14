/**
 * Single-page fill.
 *
 * When content fits on one page with space to spare, expand gaps
 * to fill the remaining area. Distributes space proportionally
 * across section-gap and entry-gap.
 */

import type { Page } from 'playwright'
import type { FitResult, CSSVariableValues } from './types.js'
import { MAX_FILL_FACTOR, IN_TO_PX, A4_HEIGHT_PX } from './types.js'
import {
	readComputedValues,
	countElements,
	getContentHeight,
} from './measure.js'
import {
	getPdfPageCount,
	applyVariables,
	injectVariableOverrides,
	formatVar,
} from './pdf.js'

/** A gap variable that can be expanded, with its current value and ceiling. */
interface Expandable {
	key: string
	current: number
	max: number
	count: number
}

/**
 * Distribute available space across expandable gaps.
 * Pure function — returns the gap adjustments.
 */
function distribute(
	remaining: number,
	expandable: Expandable[],
): Record<string, string> {
	const adjustments: Record<string, string> = {}
	let spaceLeft = remaining

	for (const { key, current, max, count } of expandable) {
		if (count <= 0 || current >= max || spaceLeft <= 0) continue

		const maxExpansion = (max - current) * count
		const expansion = Math.min(spaceLeft, maxExpansion)
		const newGap = current + expansion / count
		adjustments[key] = formatVar(key, newGap)
		spaceLeft -= expansion
	}

	return adjustments
}

/**
 * Iteratively fill a single page by expanding gaps.
 * Uses cheap HTML renders to measure, then one final PDF render to verify.
 * Returns null if the page is already full or if expansion overflows.
 */
export async function fillSinglePage(
	page: Page,
	html: string,
	originalValues?: CSSVariableValues,
): Promise<FitResult | null> {
	const initial = await readComputedValues(page)
	const counts = await countElements(page)
	let contentHeight = await getContentHeight(page)

	const marginYPx = (initial['page-margin-y'] ?? 0.5) * IN_TO_PX
	const capacity = A4_HEIGHT_PX - 2 * marginYPx
	let remaining = capacity - contentHeight

	if (remaining <= 5) return null

	let current = initial
	let totalAdjustments: Record<string, string> = {}
	const TARGET_BLANK = 3 // aim for 3px blank
	const MAX_ITERATIONS = 5

	// Iteratively fill using HTML renders (cheap) until we get tight
	for (
		let iter = 0;
		iter < MAX_ITERATIONS && remaining > TARGET_BLANK;
		iter++
	) {
		// Allow 10% expansion beyond original to compensate for prediction errors
		// while preventing excessive expansion (was 3x before)
		const maxExpansion = (val: number) => val * 1.1

		const expandable: Expandable[] = [
			{
				key: 'section-gap',
				current: current['section-gap'] ?? 10,
				max: maxExpansion(
					originalValues?.['section-gap'] ?? current['section-gap'] ?? 10,
				),
				count: counts.sections,
			},
			{
				key: 'entry-gap',
				current: current['entry-gap'] ?? 5,
				max: maxExpansion(
					originalValues?.['entry-gap'] ?? current['entry-gap'] ?? 5,
				),
				count: counts.entries,
			},
		]

		// Fill 80% of remaining space per iteration (conservative per step, but we iterate)
		const stepRemaining = remaining * 0.8
		const stepAdjustments = distribute(stepRemaining, expandable)

		if (Object.keys(stepAdjustments).length === 0) break

		// Apply and measure with HTML (cheap)
		await applyVariables(page, stepAdjustments)
		contentHeight = await getContentHeight(page)
		remaining = capacity - contentHeight

		// Merge adjustments
		for (const [key, value] of Object.entries(stepAdjustments)) {
			totalAdjustments[key] = value
		}
		current = await readComputedValues(page)
	}

	// Final PDF render to verify we didn't overflow
	const finalPages = await getPdfPageCount(page)

	if (finalPages > 1) return null

	const finalHtml = injectVariableOverrides(html, totalAdjustments)
	return {
		html: finalHtml,
		adjustments: totalAdjustments,
		originalPages: 1,
		finalPages: 1,
	}
}
