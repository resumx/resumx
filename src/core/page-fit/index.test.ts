import { describe, it, expect, afterAll } from 'vitest'
import { fitToPages } from './index.js'
import { browserPool } from '../../lib/browser-pool/index.js'

describe('fitToPages (integration)', () => {
	afterAll(async () => {
		await browserPool.closeAll()
	})

	function buildTestHtml(body: string): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
<style>
:root {
	--font-family: 'Times New Roman', serif;
	--font-size: 11pt;
	--line-height: 1.35;
	--text-color: #333;
	--page-margin-x: 0.5in;
	--page-margin-y: 0.5in;
	--section-gap: 10px;
	--entry-gap: 5px;
	--row-gap: 2px;
}

@page {
	size: A4;
	margin: var(--page-margin-y) var(--page-margin-x);
}

body {
	font-family: var(--font-family);
	font-size: var(--font-size);
	line-height: var(--line-height);
	color: var(--text-color);
	margin: 0;
	padding: var(--page-margin-y) var(--page-margin-x);
}

h2 { margin-bottom: 4px; }
section + section { margin-top: var(--section-gap); }
.entry > * + * { margin-top: var(--row-gap); }
.entry + .entry { margin-top: var(--entry-gap); }
ul { margin: 0; padding-left: 20px; }
li { margin-bottom: var(--row-gap); }
</style>
</head>
<body>${body}</body>
</html>`
	}

	function makeEntry(title: string, bullets: number): string {
		const items = Array.from(
			{ length: bullets },
			(_, i) =>
				`<li>Achievement ${i + 1}: Built and deployed enterprise-scale distributed systems</li>`,
		).join('\n')
		return `<div class="entry"><h3>${title}</h3><ul>${items}</ul></div>`
	}

	function makeSection(
		heading: string,
		entries: number,
		bulletsPerEntry: number,
	): string {
		const entryHtml = Array.from({ length: entries }, (_, i) =>
			makeEntry(`Position ${i + 1}`, bulletsPerEntry),
		).join('\n')
		return `<section><h2>${heading}</h2>\n${entryHtml}</section>`
	}

	/** Parse a CSS pt value like "10.5pt" to a number, or return the original (11) if undefined. */
	function parsePt(value: string | undefined): number {
		if (!value) return 11
		return parseFloat(value)
	}

	it('returns original HTML when content fits within target pages', async () => {
		const html = buildTestHtml(`
			<h1>John Doe</h1>
			<section><h2>Experience</h2>
			<div class="entry"><h3>Developer</h3>
			<ul><li>Built things</li></ul></div></section>
		`)

		const result = await fitToPages(html, 1)

		expect(result.originalPages).toBe(1)
		expect(result.finalPages).toBe(1)
	})

	it('shrinks overflowing content to fit 1 page', async () => {
		const body = `
			<h1>John Doe</h1>
			${makeSection('Experience', 3, 4)}
			${makeSection('Projects', 2, 3)}
			${makeSection('Education', 2, 3)}
			${makeSection('Skills', 2, 2)}
		`

		const result = await fitToPages(buildTestHtml(body), 1)

		expect(result.originalPages).toBeGreaterThan(1)
		expect(result.finalPages).toBe(1)
		expect(Object.keys(result.adjustments).length).toBeGreaterThan(0)
		expect(result.html).toContain(':root {')
	})

	it('applies adjustments for slight overflow', async () => {
		const body = `
			<h1>John Doe</h1>
			${makeSection('Experience', 3, 4)}
			${makeSection('Projects', 2, 3)}
			${makeSection('Education', 1, 2)}
			${makeSection('Skills', 1, 2)}
		`

		const result = await fitToPages(buildTestHtml(body), 1)

		expect(result.finalPages).toBeLessThanOrEqual(1)
	})

	it('bails out gracefully when content is too much for 1 page', async () => {
		const body = `
			<h1>John Doe</h1>
			${makeSection('Experience', 5, 8)}
			${makeSection('Projects', 5, 8)}
			${makeSection('Education', 5, 8)}
			${makeSection('Skills', 5, 8)}
			${makeSection('Publications', 5, 8)}
			${makeSection('Awards', 5, 8)}
		`

		const result = await fitToPages(buildTestHtml(body), 1)

		expect(result.originalPages).toBeGreaterThan(1)
		expect(result.finalPages).toBeGreaterThanOrEqual(1)
	})

	it('handles multi-page target (pages: 2)', async () => {
		const body = `
			<h1>John Doe</h1>
			${makeSection('Experience', 4, 6)}
			${makeSection('Projects', 4, 6)}
			${makeSection('Education', 3, 4)}
		`

		const result = await fitToPages(buildTestHtml(body), 2)

		expect(result.finalPages).toBeLessThanOrEqual(result.originalPages)
	})

	it('shrinks to 2 pages without over-shrinking font-size', async () => {
		const body = `
			<h1>John Doe</h1>
			${makeSection('Experience', 4, 6)}
			${makeSection('Projects', 3, 5)}
			${makeSection('Education', 2, 4)}
			${makeSection('Skills', 2, 3)}
		`

		const result = await fitToPages(buildTestHtml(body), 2)

		expect(result.originalPages).toBeGreaterThan(2)
		expect(result.finalPages).toBe(2)
		const fontSize = parsePt(result.adjustments['font-size'])
		expect(fontSize).toBeGreaterThanOrEqual(10)
	})

	it('shrinks to 3 pages without over-shrinking font-size', async () => {
		const body = `
			<h1>John Doe</h1>
			${makeSection('Experience', 5, 6)}
			${makeSection('Projects', 5, 5)}
			${makeSection('Education', 4, 4)}
			${makeSection('Skills', 3, 4)}
			${makeSection('Publications', 3, 3)}
		`

		const result = await fitToPages(buildTestHtml(body), 3)

		expect(result.originalPages).toBeGreaterThan(3)
		expect(result.finalPages).toBe(3)
		const fontSize = parsePt(result.adjustments['font-size'])
		expect(fontSize).toBeGreaterThanOrEqual(10)
	})

	it('does not collapse font-size to minimum when fitting 3 pages to 2', async () => {
		const body = `
			<h1>John Doe</h1>
			${makeSection('Experience', 4, 6)}
			${makeSection('Projects', 4, 5)}
			${makeSection('Education', 3, 4)}
		`

		const result = await fitToPages(buildTestHtml(body), 2)

		expect(result.originalPages).toBeGreaterThanOrEqual(3)
		expect(result.finalPages).toBe(2)
		const fontSize = parsePt(result.adjustments['font-size'])
		expect(fontSize).toBeGreaterThan(9)
	})
})
