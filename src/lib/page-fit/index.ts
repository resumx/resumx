/**
 * Page Fit Module
 *
 * Adjusts CSS variables to fit resume content into a target page count.
 * Shrinking and filling are mutually exclusive paths.
 *
 * Shrink path (content overflows target):
 * 1. Measure: page count (PDF) + DOM layout snapshot.
 * 2. Solve: find initial shrink factor via predictive model.
 * 3. Refine: binary-search with HTML renders for precise fit.
 * 4. Verify: confirm with PDF render; fallback to minimums if needed.
 * 5. Absorb: increase page-margin-y for discrete blank jumps.
 *
 * Fill path (content already fits):
 * Expand gaps to fill remaining space on a single page.
 */

import type { Page } from 'playwright'
import type { FitResult, VariableRange, CSSVariableValues } from './types.js'
import { MINIMUMS, A4_WIDTH_PX, A4_HEIGHT_PX, IN_TO_PX } from './types.js'
import { browserPool } from '../browser-pool.js'
import { solve, interpolate } from './solve.js'
import { predictTotalHeight, pageCapacity } from './predict.js'
import { measurePage, readComputedValues, getContentHeight } from './measure.js'
import { fillSinglePage } from './fill.js'
import {
	getPdfPageCount,
	applyVariables,
	injectVariableOverrides,
	formatVar,
	buildAdjustments,
} from './pdf.js'

// ── Public API ─────────────────────────────────────────────────────────────

export type { FitResult }
export { injectVariableOverrides, predictTotalHeight }
export { predictHeight } from './predict.js'
export { solve, interpolate } from './solve.js'
export type {
	TextMetricsSnapshot,
	TextBlockMetric,
	ElementCounts,
} from './types.js'
export { MINIMUMS } from './types.js'

export async function fitToPages(
	html: string,
	targetPages: number,
): Promise<FitResult> {
	const browser = await browserPool.acquire()
	try {
		const page = await browser.newPage()
		try {
			await page.setViewportSize({ width: A4_WIDTH_PX, height: 1123 })
			await page.setContent(html, { waitUntil: 'networkidle' })

			// ── 1. Measure ──
			const originalPages = await getPdfPageCount(page)

			if (originalPages <= targetPages) {
				return await handleFit(page, html, originalPages, targetPages)
			}

			// ── 2. Solve ──
			const snapshot = await measurePage(page)

			// Power values control shrink priority:
			//   0.5 = spacing (shrinks fast, cheap perceptual cost)
			//   1.0 = margins (linear, moderate cost)
			//   2.0 = typography (resists change, highest cost)
			const variables: VariableRange[] = [
				{
					key: 'font-size',
					original: snapshot.current['font-size'],
					minimum: MINIMUMS['font-size'],
					power: 2,
				},
				{
					key: 'line-height',
					original: snapshot.current['line-height'],
					minimum: MINIMUMS['line-height'],
					power: 2,
				},
				{
					key: 'page-margin-x',
					original: snapshot.current['page-margin-x'],
					minimum: MINIMUMS['page-margin-x'],
					power: 1,
				},
				{
					key: 'page-margin-y',
					original: snapshot.current['page-margin-y'],
					minimum: MINIMUMS['page-margin-y'],
					power: 1,
				},
				{
					key: 'section-gap',
					original: snapshot.current['section-gap'],
					minimum: MINIMUMS['section-gap'],
					power: 0.5,
				},
				{
					key: 'entry-gap',
					original: snapshot.current['entry-gap'],
					minimum: MINIMUMS['entry-gap'],
					power: 0.5,
				},
				{
					key: 'bullet-gap',
					original: snapshot.current['bullet-gap'],
					minimum: MINIMUMS['bullet-gap'],
					power: 0.5,
				},
				{
					key: 'data-row-gap',
					original: snapshot.current['data-row-gap'],
					minimum: MINIMUMS['data-row-gap'],
					power: 0.5,
				},
			]

			const { t: solverT } = solve({
				variables,
				fits: v => {
					const cv = v as CSSVariableValues
					return (
						predictTotalHeight(snapshot, cv)
						<= pageCapacity(cv['page-margin-y'], targetPages)
					)
				},
			})

			// ── 3. Refine with HTML renders ──
			// Use cheap HTML renders to binary-search for the smallest t
			// where content actually fits. Search the full range [0, 1]
			// because prediction may be inaccurate.
			// ⚠️ FLAGGED: binary search over t works correctly with weighted curves
			// because interpolate() is monotonic in t for all power > 0.
			// However, the search space is now "lumpy": small t changes cause
			// large spacing shifts but tiny font changes. The 12 iterations
			// may need tuning if precision suffers at the spacing end.
			let lo = 0 // no shrinking (overflows)
			let hi = 1 // maximum shrinking (definitely fits)
			const REFINE_ITERATIONS = 12
			const TARGET_BLANK = 5 // aim for no more than 5px blank
			let minBlank = Number.NEGATIVE_INFINITY
			let minPdfPages = Number.POSITIVE_INFINITY

			// Check if t=1 (minimums) actually fits in HTML before binary search
			{
				const minValues = interpolate(variables, 1)
				const minAdj = buildAdjustments(minValues, snapshot.current)
				await applyVariables(page, minAdj)
				const minH = await getContentHeight(page)
				const minCv = await readComputedValues(page)
				const minMarginYPx = minCv['page-margin-y'] * IN_TO_PX
				const minCap = A4_HEIGHT_PX - 2 * minMarginYPx
				minBlank = minCap - minH
				minPdfPages = await getPdfPageCount(page)
				// Reset to original before binary search
				const origAdj = buildAdjustments(
					interpolate(variables, 0),
					snapshot.current,
				)
				await applyVariables(page, origAdj)
			}

			// If even minimums cannot reach the target AND do not reduce page count,
			// keep the original layout for readability instead of over-shrinking.
			if (minPdfPages > targetPages && minPdfPages >= originalPages) {
				return {
					html,
					adjustments: {},
					originalPages,
					finalPages: originalPages,
				}
			}

			for (let i = 0; i < REFINE_ITERATIONS; i++) {
				const mid = (lo + hi) / 2
				const candidateValues = interpolate(variables, mid)
				const candidateAdj = buildAdjustments(candidateValues, snapshot.current)

				await applyVariables(page, candidateAdj)
				const contentH = await getContentHeight(page)
				const current = await readComputedValues(page)
				const marginYPx = current['page-margin-y'] * IN_TO_PX
				const cap = A4_HEIGHT_PX - 2 * marginYPx
				const blank = cap - contentH

				if (blank >= 0 && blank <= TARGET_BLANK) {
					hi = mid
					break
				} else if (blank > TARGET_BLANK) {
					hi = mid
				} else {
					lo = mid
				}
			}

			// Apply the final refined values
			const finalValues = interpolate(variables, hi)
			const allAdjustments = buildAdjustments(finalValues, snapshot.current)
			await applyVariables(page, allAdjustments)

			// ── 4. Verify with PDF ──
			let currentPages = await getPdfPageCount(page)

			// If HTML/PDF disagree, refine with PDF page count first.
			// Jumping straight to minimums can over-shrink and create
			// large visual blank when page-breaks are discrete.
			if (currentPages > targetPages) {
				if (minPdfPages <= targetPages) {
					let pdfLo = hi
					let pdfHi = 1
					const PDF_REFINE_ITERATIONS = 8

					for (let i = 0; i < PDF_REFINE_ITERATIONS; i++) {
						const mid = (pdfLo + pdfHi) / 2
						const midValues = interpolate(variables, mid)
						const midAdj = buildAdjustments(midValues, snapshot.current)
						await applyVariables(page, midAdj)
						const midPages = await getPdfPageCount(page)
						if (midPages <= targetPages) {
							pdfHi = mid
						} else {
							pdfLo = mid
						}
					}

					const pdfValues = interpolate(variables, pdfHi)
					Object.assign(
						allAdjustments,
						buildAdjustments(pdfValues, snapshot.current),
					)
					await applyVariables(page, allAdjustments)
					currentPages = await getPdfPageCount(page)
				}

				// Last-resort fallback only when PDF refine still cannot hit target.
				if (currentPages > targetPages) {
					for (const v of variables) {
						allAdjustments[v.key] = formatVar(v.key, v.minimum)
					}
					await applyVariables(page, allAdjustments)
					currentPages = await getPdfPageCount(page)
				}
			}

			// ── 5. Absorb discrete blank with margin ──
			// Line unwrapping can cause discrete ~15-20px blank jumps
			// that binary search can't resolve. Instead of expanding
			// gaps (incompatible with shrinking), increase page-margin-y
			// to absorb the blank. This doesn't reflow content.
			if (currentPages === 1) {
				const contentH = await getContentHeight(page)
				const cv = await readComputedValues(page)
				const marginYPx = cv['page-margin-y'] * IN_TO_PX
				const cap = A4_HEIGHT_PX - 2 * marginYPx
				const blank = cap - contentH

				if (blank > TARGET_BLANK) {
					// Increase margin to absorb half the excess (split top/bottom)
					const excessPx = blank - TARGET_BLANK
					const MAX_MARGIN_ABSORB_PER_SIDE_PX = 12
					const absorbPerSidePx = Math.min(
						excessPx / 2,
						MAX_MARGIN_ABSORB_PER_SIDE_PX,
					)
					const newMarginIn = cv['page-margin-y'] + absorbPerSidePx / IN_TO_PX
					const previousMarginY = allAdjustments['page-margin-y']
					allAdjustments['page-margin-y'] = formatVar(
						'page-margin-y',
						newMarginIn,
					)
					await applyVariables(page, allAdjustments)

					const finalPages = await getPdfPageCount(page)

					// Absorption must never worsen pagination.
					// If the margin increase introduces an extra page, revert.
					if (finalPages > targetPages) {
						if (previousMarginY === undefined) {
							delete allAdjustments['page-margin-y']
						} else {
							allAdjustments['page-margin-y'] = previousMarginY
						}
						await applyVariables(page, allAdjustments)
						currentPages = await getPdfPageCount(page)
					} else {
						currentPages = finalPages
					}
				}
			}

			// ── Done ──
			return {
				html: injectVariableOverrides(html, allAdjustments),
				adjustments: allAdjustments,
				originalPages,
				finalPages: currentPages,
			}
		} finally {
			await page.close()
		}
	} finally {
		browserPool.release(browser)
	}
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function handleFit(
	page: Page,
	html: string,
	originalPages: number,
	targetPages: number,
): Promise<FitResult> {
	if (targetPages === 1 && originalPages === 1) {
		const fillResult = await fillSinglePage(page, html)
		if (fillResult) return fillResult
	}
	return {
		html,
		adjustments: {},
		originalPages,
		finalPages: originalPages,
	}
}
