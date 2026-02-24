/**
 * Heuristic tightness test for page-fit.
 *
 * Starts with a resume that overflows 1 page, then removes one content
 * line at a time from the bottom. After each removal, fitToPages must
 * produce a single-page result with less than MAX_BLANK pixels of
 * unused space. If any step exceeds the threshold, the algorithm
 * needs fixing, not the threshold.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateHtml } from '../html-generator.js'
import { DEFAULT_STYLESHEET } from '../styles.js'
import { parseFrontmatterFromString } from '../frontmatter.js'
import { fitToPages } from './index.js'
import { getContentHeight, readComputedValues } from './measure.js'
import { A4_HEIGHT_PX, A4_WIDTH_PX, IN_TO_PX } from './types.js'
import { browserPool } from '../../lib/browser-pool/index.js'

// ── Constants ──────────────────────────────────────────────────────────────

const MAX_BLANK = 10 // px
const CSS_PATH = DEFAULT_STYLESHEET
const FIXTURES_DIR = resolve(process.cwd(), 'tests/fixtures')

interface Fixture {
	content: string
	variables?: Record<string, string>
}

function readFixture(name: string): Fixture {
	const raw = readFileSync(resolve(FIXTURES_DIR, name), 'utf8').trim()
	const result = parseFrontmatterFromString(raw)
	if (!result.ok) throw new Error(`Fixture ${name}: ${result.error}`)
	return {
		content: result.content.trim(),
		variables: result.config?.style,
	}
}

const JORDAN = readFixture('page-fit-jordan-mitchell.md')
const ADRIAN = readFixture('page-fit-adrian-sterling.md')
const TEMP = readFixture('page-fit-temp-resume.md')

// ── Helpers ────────────────────────────────────────────────────────────────

function removeContentLines(md: string, count: number): string {
	if (count === 0) return md
	const lines = md.split('\n')
	const contentIndices: number[] = []
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim() !== '') contentIndices.push(i)
	}
	const toRemove = new Set(contentIndices.slice(-count))
	return lines.filter((_, i) => !toRemove.has(i)).join('\n')
}

async function measureBlank(html: string): Promise<number> {
	const browser = await browserPool.acquire()
	try {
		const page = await browser.newPage()
		try {
			await page.setViewportSize({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX })
			await page.setContent(html, { waitUntil: 'domcontentloaded' })
			const contentHeight = await getContentHeight(page)
			const values = await readComputedValues(page)
			const capacity = A4_HEIGHT_PX - 2 * values['page-margin-y'] * IN_TO_PX
			return capacity - contentHeight
		} finally {
			await page.close()
		}
	} finally {
		browserPool.release(browser)
	}
}

interface TightnessResult {
	removal: number
	blank: number
	finalPages: number
	marginY?: string
}

async function measureTightness(
	fixture: Fixture,
	removals: number,
): Promise<TightnessResult[]> {
	const results: TightnessResult[] = []
	for (let i = 0; i < removals; i++) {
		const trimmed = removeContentLines(fixture.content, i)
		const html = await generateHtml(trimmed, {
			cssPaths: [CSS_PATH],
			variables: fixture.variables,
		})
		const result = await fitToPages(html, 1)
		if (result.finalPages === 1) {
			const blank = await measureBlank(result.html)
			results.push({
				removal: i,
				blank,
				finalPages: 1,
				marginY: result.adjustments['page-margin-y'],
			})
		} else {
			results.push({
				removal: i,
				blank: Number.NaN,
				finalPages: result.finalPages,
				marginY: result.adjustments['page-margin-y'],
			})
		}
	}
	console.table(results)
	return results
}

function expectAllTight(results: TightnessResult[], label: string) {
	for (const { removal, blank, finalPages } of results) {
		if (finalPages !== 1) continue
		expect(
			blank,
			`${label} removal ${removal}: blank ${blank.toFixed(1)}px exceeds ${MAX_BLANK}px`,
		).toBeLessThan(MAX_BLANK)
	}
}

// ── Test ────────────────────────────────────────────────────────────────────

describe('page-fit heuristic: tightness', () => {
	afterAll(async () => {
		await browserPool.closeAll()
	})

	it(
		'produces a tight fit as content is progressively removed',
		async () => {
			const results = await measureTightness(JORDAN, 22)

			for (const r of results) {
				expect(r.finalPages, `removal ${r.removal} did not fit`).toBe(1)
			}
			expectAllTight(results, 'jordan')
		},
		{ timeout: 300_000 },
	)

	it(
		'produces a tight fit with Adrian Sterling resume',
		async () => {
			const results = await measureTightness(ADRIAN, 22)

			for (const r of results) {
				if (r.finalPages > 1 && r.marginY) {
					expect(parseFloat(r.marginY)).toBeLessThanOrEqual(0.6)
				}
			}
			expectAllTight(results, 'adrian')
		},
		{ timeout: 300_000 },
	)

	it(
		'stays tight around one-line boundary for .temp/resume.md',
		async () => {
			const results = await measureTightness(TEMP, 16)

			expect(results.some(r => r.finalPages > 1)).toBe(true)
			expect(results.some(r => r.finalPages === 1)).toBe(true)
			expectAllTight(results, 'temp')
		},
		{ timeout: 120_000 },
	)
})
