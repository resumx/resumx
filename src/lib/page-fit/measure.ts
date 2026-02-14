/**
 * DOM measurement functions.
 *
 * Collects all layout data from a Playwright page in a single pass.
 * Returns a PageSnapshot used by the solver and predictor.
 */

import type { Page } from 'playwright'
import type {
	CSSVariableValues,
	ElementCounts,
	TextMetricsSnapshot,
	PageSnapshot,
} from './types.js'
import { GAP_ENTRIES } from './types.js'
import { predictHeight } from './predict.js'

// ── Individual measurements ────────────────────────────────────────────────

/** Read current computed CSS variable values from the page. */
export async function readComputedValues(
	page: Page,
): Promise<CSSVariableValues> {
	return page.evaluate(() => {
		const cs = getComputedStyle(document.documentElement)
		return {
			'section-gap': parseFloat(cs.getPropertyValue('--section-gap')) || 0,
			'entry-gap': parseFloat(cs.getPropertyValue('--entry-gap')) || 0,
			'bullet-gap': parseFloat(cs.getPropertyValue('--bullet-gap')) || 0,
			'data-row-gap': parseFloat(cs.getPropertyValue('--data-row-gap')) || 0,
			'line-height': parseFloat(cs.getPropertyValue('--line-height')) || 0,
			'font-size': parseFloat(cs.getPropertyValue('--font-size')) || 0,
			'page-margin-y': parseFloat(cs.getPropertyValue('--page-margin-y')) || 0,
			'page-margin-x': parseFloat(cs.getPropertyValue('--page-margin-x')) || 0,
		}
	})
}

/** Count elements in the DOM for analytical gap calculation. */
export async function countElements(page: Page): Promise<ElementCounts> {
	return page.evaluate(() => ({
		bullets: document.querySelectorAll('li').length,
		dataRows: document.querySelectorAll('dl, table').length,
		entries: document.querySelectorAll('.entry + .entry').length,
		sections: document.querySelectorAll('section + section').length,
	}))
}

/** Get content height in screen mode (excludes body padding). */
export async function getContentHeight(page: Page): Promise<number> {
	return page.evaluate(() => {
		const body = document.body
		const cs = getComputedStyle(body)
		const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
		return body.scrollHeight - paddingY
	})
}

/** Collect per-element text metrics for predictive layout. */
export async function measureTextMetrics(
	page: Page,
): Promise<TextMetricsSnapshot> {
	return page.evaluate(() => {
		const bodyCs = getComputedStyle(document.body)
		const baseFontSizePx = parseFloat(bodyCs.fontSize) || 14
		const baseLineHeight =
			parseFloat(bodyCs.lineHeight) / baseFontSizePx || 1.35

		const textSelectors =
			'p, li, h1, h2, h3, h4, h5, h6, dt, dd, span.contact, address'
		const blocks: Array<{
			textWidth: number
			containerWidth: number
			lines: number
			heightPerLine: number
			fontScale: number
		}> = []

		let fixedHeight = 0

		for (const el of Array.from(document.querySelectorAll(textSelectors))) {
			const elCs = getComputedStyle(el)
			const elFontSize = parseFloat(elCs.fontSize) || baseFontSizePx
			const fontScale = elFontSize / baseFontSizePx

			const range = document.createRange()
			range.selectNodeContents(el)
			const rects = range.getClientRects()
			const lineCount = rects.length || 1

			const rect = el.getBoundingClientRect()
			const heightPerLine = lineCount > 0 ? rect.height / lineCount : 0

			// Measure actual text width using canvas for accuracy
			const text = (el as HTMLElement).textContent || ''
			const canvas = document.createElement('canvas')
			const ctx = canvas.getContext('2d')!
			ctx.font = `${elCs.fontWeight} ${elCs.fontSize} ${elCs.fontFamily}`
			const measured = ctx.measureText(text)
			const textWidth = measured.width

			const parent = el.parentElement ?? document.body
			const parentCs = getComputedStyle(parent)
			const containerWidth =
				parent.clientWidth
				- parseFloat(parentCs.paddingLeft)
				- parseFloat(parentCs.paddingRight)

			blocks.push({
				textWidth,
				containerWidth: Math.max(1, containerWidth),
				lines: lineCount,
				heightPerLine,
				fontScale,
			})
		}

		for (const el of Array.from(document.querySelectorAll('hr, img, svg'))) {
			fixedHeight += el.getBoundingClientRect().height
		}

		const rootCs = getComputedStyle(document.documentElement)
		const baseMarginXIn =
			parseFloat(rootCs.getPropertyValue('--page-margin-x')) || 0.5

		return {
			blocks,
			fixedHeight,
			baseFontSizePx,
			baseLineHeight,
			baseMarginXIn,
			pageWidthPx: 794,
		}
	})
}

// ── Combined snapshot ──────────────────────────────────────────────────────

/**
 * Collect all DOM measurements into a single PageSnapshot.
 * Called once after the initial PDF render confirms overflow.
 */
export async function measurePage(page: Page): Promise<PageSnapshot> {
	const current = await readComputedValues(page)
	const counts = await countElements(page)
	const contentHeight = await getContentHeight(page)
	const textMetrics = await measureTextMetrics(page)

	// Calibrate: model must match actual DOM height at t = 0
	// ⚠️ FLAGGED: layoutNoise is a single constant calibrated at original values.
	// With weighted curves, spacing reaches its minimum much earlier than font-size.
	// Any non-linear CSS effects (margin collapsing, text-wrap: pretty reflow)
	// that depend on specific gap values will make layoutNoise drift as t increases.
	// The HTML refinement loop compensates, but a larger layoutNoise drift means
	// more refinement iterations to converge.
	const baseTextHeight = predictHeight(
		textMetrics,
		textMetrics.baseFontSizePx,
		textMetrics.baseLineHeight,
		textMetrics.baseMarginXIn,
	)
	let baseGapHeight = 0
	for (const { key, countKey } of GAP_ENTRIES) {
		baseGapHeight += (current[key] ?? 0) * (counts[countKey] ?? 0)
	}
	const layoutNoise = contentHeight - baseTextHeight - baseGapHeight

	return { current, counts, contentHeight, textMetrics, layoutNoise }
}
