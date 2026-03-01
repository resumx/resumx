/**
 * Heuristic tightness test for page-fit.
 *
 * Starts with a resume that overflows the target page count, then removes
 * one content line at a time from the bottom. After each removal, fitToPages
 * must produce a result at the target page count with less than MAX_BLANK
 * pixels of unused space. If any step exceeds the threshold, the algorithm
 * needs fixing, not the threshold.
 */

import { describe, it, expect, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateHtml } from '../html-generator.js'
import { DEFAULT_STYLESHEET } from '../styles.js'
import type { DocumentContext } from '../types.js'
import type { ResolvedView } from '../view/types.js'

const DEFAULT_VIEW: ResolvedView = {
	selects: null,
	sections: { hide: [], pin: [] },
	pages: null,
	bulletOrder: 'none',
	vars: {},
	style: {},
	format: 'pdf',
	output: null,
	css: null,
	lang: null,
}

function genHtml(
	content: string,
	opts: { cssPaths: string[]; variables?: Record<string, string> },
): Promise<string> {
	const doc: DocumentContext = { content, baseDir: '' }
	const view: ResolvedView = {
		...DEFAULT_VIEW,
		style: opts.variables ?? {},
		css: opts.cssPaths,
	}
	return generateHtml(doc, view)
}
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
const MULTIPAGE = readFixture('page-fit-multipage.md')

const BULLET_POOL = [
	'Built and deployed enterprise-scale distributed systems achieving 99.99% uptime across three regions',
	'Reduced API response latency from 450ms to 35ms through query optimization and Redis caching layer implementation',
	'Led migration of 200+ microservices from on-premise data centers to AWS, completing 6 months ahead of schedule',
	'Designed real-time event processing pipeline handling 2M+ events per second using Kafka and Apache Flink',
	'Mentored team of 8 junior engineers through structured code reviews and pair programming sessions weekly',
	'Implemented automated CI/CD pipeline with GitHub Actions reducing deployment cycle time from 2 weeks to 2 hours',
	'Architected scalable data warehouse solution processing 50TB of daily analytics using Snowflake and dbt',
]

/** Generate a markdown resume with controllable content density. */
function generateResumeMd(
	sections: number,
	entriesPerSection: number,
	bulletsPerEntry: number,
): string {
	const parts: string[] = ['# Test Resume\n\ntest@example.com | 555-0100\n']
	let bulletIdx = 0
	for (let s = 0; s < sections; s++) {
		parts.push(`## Section ${s + 1}\n`)
		for (let e = 0; e < entriesPerSection; e++) {
			parts.push(
				`### Position ${e + 1} at Company ${s * entriesPerSection + e + 1} || Jan 2020 - Present\n`,
			)
			for (let b = 0; b < bulletsPerEntry; b++) {
				parts.push(`- ${BULLET_POOL[bulletIdx % BULLET_POOL.length]}`)
				bulletIdx++
			}
			parts.push('')
		}
	}
	return parts.join('\n')
}

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
	fontSize?: string
	marginY?: string
}

async function measureTightness(
	fixture: Fixture,
	removals: number,
	targetPages = 1,
): Promise<TightnessResult[]> {
	const results: TightnessResult[] = []
	for (let i = 0; i < removals; i++) {
		const trimmed = removeContentLines(fixture.content, i)
		const html = await genHtml(trimmed, {
			cssPaths: [CSS_PATH],
			variables: fixture.variables,
		})
		const result = await fitToPages(html, targetPages)
		if (result.finalPages === targetPages) {
			const blank = await measureBlank(result.html)
			results.push({
				removal: i,
				blank,
				finalPages: targetPages,
				fontSize: result.adjustments['font-size'],
				marginY: result.adjustments['page-margin-y'],
			})
		} else {
			results.push({
				removal: i,
				blank: Number.NaN,
				finalPages: result.finalPages,
				fontSize: result.adjustments['font-size'],
				marginY: result.adjustments['page-margin-y'],
			})
		}
	}
	console.table(results)
	return results
}

function expectAllTight(
	results: TightnessResult[],
	label: string,
	targetPages = 1,
) {
	for (const { removal, blank, finalPages } of results) {
		if (finalPages !== targetPages) continue
		expect(
			blank,
			`${label} removal ${removal}: blank ${blank.toFixed(1)}px exceeds ${MAX_BLANK}px`,
		).toBeLessThan(MAX_BLANK)
	}
}

/** Font-size must never collapse to minimums for multi-page targets. */
function expectNotOverShrunk(
	results: TightnessResult[],
	label: string,
	targetPages: number,
	minFontSizePt = 10,
) {
	for (const { removal, fontSize, finalPages } of results) {
		if (finalPages !== targetPages) continue
		const pt = fontSize ? parseFloat(fontSize) : 11
		expect(
			pt,
			`${label} removal ${removal}: font-size ${pt}pt < ${minFontSizePt}pt (over-shrunk)`,
		).toBeGreaterThanOrEqual(minFontSizePt)
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

describe('page-fit heuristic: multi-page tightness', () => {
	afterAll(async () => {
		await browserPool.closeAll()
	})

	it(
		'fits to 2 pages without over-shrinking',
		async () => {
			const md = generateResumeMd(3, 3, 7)
			const html = await genHtml(md, { cssPaths: [CSS_PATH] })
			const result = await fitToPages(html, 2)

			expect(
				result.originalPages,
				'fixture must overflow 2 pages',
			).toBeGreaterThan(2)
			expect(result.finalPages).toBe(2)
			const pt =
				result.adjustments['font-size'] ?
					parseFloat(result.adjustments['font-size'])
				:	11
			expect(pt, `font-size ${pt}pt over-shrunk`).toBeGreaterThanOrEqual(10)
		},
		{ timeout: 120_000 },
	)

	it(
		'fits to 3 pages without over-shrinking',
		async () => {
			const md = generateResumeMd(5, 3, 7)
			const html = await genHtml(md, { cssPaths: [CSS_PATH] })
			const result = await fitToPages(html, 3)

			expect(
				result.originalPages,
				'fixture must overflow 3 pages',
			).toBeGreaterThan(3)
			expect(result.finalPages).toBe(3)
			const pt =
				result.adjustments['font-size'] ?
					parseFloat(result.adjustments['font-size'])
				:	11
			expect(pt, `font-size ${pt}pt over-shrunk`).toBeGreaterThanOrEqual(10)
		},
		{ timeout: 120_000 },
	)
})
