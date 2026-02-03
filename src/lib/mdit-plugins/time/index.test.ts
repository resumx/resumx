import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { parseHTML } from 'linkedom'
import { timePlugin } from './index.js'

// =============================================================================
// Test Utilities
// =============================================================================

function createMd() {
	return new MarkdownIt().use(timePlugin)
}

function parseHtml(html: string) {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!
	return {
		root,
		querySelector: (selector: string) => root.querySelector(selector),
		querySelectorAll: (selector: string) => root.querySelectorAll(selector),
	}
}

// =============================================================================
// Tests
// =============================================================================

describe('timePlugin', () => {
	describe('single dates', () => {
		it('wraps a month and year in time tag', () => {
			const md = createMd()
			const html = md.renderInline('Started in Jan 2020')
			const doc = parseHtml(html)

			const timeEl = doc.querySelector('time')
			expect(timeEl).toBeTruthy()
			expect(timeEl?.getAttribute('datetime')).toBe('2020-01')
			expect(timeEl?.textContent).toBe('Jan 2020')
		})

		it('wraps a full date in time tag with full precision', () => {
			const md = createMd()
			const html = md.renderInline('Meeting on January 15, 2020')
			const doc = parseHtml(html)

			const timeEl = doc.querySelector('time')
			expect(timeEl).toBeTruthy()
			expect(timeEl?.getAttribute('datetime')).toBe('2020-01-15')
			expect(timeEl?.textContent).toBe('January 15, 2020')
		})

		it('wraps year-only date with year precision', () => {
			const md = createMd()
			const html = md.renderInline('Founded in 2020')
			const doc = parseHtml(html)

			const timeEl = doc.querySelector('time')
			expect(timeEl).toBeTruthy()
			expect(timeEl?.getAttribute('datetime')).toBe('2020')
			expect(timeEl?.textContent).toBe('2020')
		})

		it.each([
			['Jan 2020', '2020-01'],
			['January 2020', '2020-01'],
			['Feb 2021', '2021-02'],
			['March 2022', '2022-03'],
			['Dec 2024', '2024-12'],
		])('parses "%s" as datetime="%s"', (input, expectedDatetime) => {
			const md = createMd()
			const html = md.renderInline(input)
			const doc = parseHtml(html)

			const timeEl = doc.querySelector('time')
			expect(timeEl?.getAttribute('datetime')).toBe(expectedDatetime)
		})
	})

	describe('date ranges', () => {
		it('wraps date range with en-dash in span.date-range with two time tags', () => {
			const md = createMd()
			const html = md.renderInline('Jan 2020 – Dec 2024')
			const doc = parseHtml(html)

			const rangeSpan = doc.querySelector('span.date-range')
			expect(rangeSpan).toBeTruthy()

			const timeTags = rangeSpan?.querySelectorAll('time')
			expect(timeTags?.length).toBe(2)

			expect(timeTags?.[0]?.getAttribute('datetime')).toBe('2020-01')
			expect(timeTags?.[0]?.textContent).toBe('Jan 2020')

			expect(timeTags?.[1]?.getAttribute('datetime')).toBe('2024-12')
			expect(timeTags?.[1]?.textContent).toBe('Dec 2024')
		})

		it('wraps date range with hyphen in span.date-range', () => {
			const md = createMd()
			const html = md.renderInline('Jan 2020 - Dec 2024')
			const doc = parseHtml(html)

			const rangeSpan = doc.querySelector('span.date-range')
			expect(rangeSpan).toBeTruthy()

			const timeTags = rangeSpan?.querySelectorAll('time')
			expect(timeTags?.length).toBe(2)
		})

		it('preserves separator in date range output', () => {
			const md = createMd()
			const html = md.renderInline('Jan 2020 – Dec 2024')
			expect(html).toContain(' – ')
		})

		it.each([
			['Jan 2020 – Dec 2024', '2020-01', '2024-12'],
			['January 2020 - December 2024', '2020-01', '2024-12'],
			['2020 – 2024', '2020', '2024'],
		])(
			'parses range "%s" with start=%s end=%s',
			(input, expectedStart, expectedEnd) => {
				const md = createMd()
				const html = md.renderInline(input)
				const doc = parseHtml(html)

				const timeTags = doc.querySelectorAll('time')
				expect(timeTags.length).toBe(2)
				expect(timeTags[0]?.getAttribute('datetime')).toBe(expectedStart)
				expect(timeTags[1]?.getAttribute('datetime')).toBe(expectedEnd)
			},
		)
	})

	describe('Present/current keywords', () => {
		it('wraps both start date and Present with time tags', () => {
			const md = createMd()
			const html = md.renderInline('Jan 2020 – Present')
			const doc = parseHtml(html)

			const rangeSpan = doc.querySelector('span.date-range')
			expect(rangeSpan).toBeTruthy()

			// Should have two time tags (chrono now parses "Present" as today's date)
			const timeTags = rangeSpan?.querySelectorAll('time')
			expect(timeTags?.length).toBe(2)
			expect(timeTags?.[0]?.getAttribute('datetime')).toBe('2020-01')
			expect(timeTags?.[0]?.textContent).toBe('Jan 2020')
			expect(timeTags?.[1]?.textContent).toBe('Present')
			// The datetime for Present should be today's date
			expect(timeTags?.[1]?.getAttribute('datetime')).toMatch(
				/^\d{4}-\d{2}-\d{2}$/,
			)
		})

		it('handles case-insensitive current keywords', () => {
			const md = createMd()
			const html = md.renderInline('Jan 2020 – current')
			const doc = parseHtml(html)

			const rangeSpan = doc.querySelector('span.date-range')
			expect(rangeSpan).toBeTruthy()
			// Both dates should be wrapped
			expect(rangeSpan?.querySelectorAll('time')?.length).toBe(2)
		})

		it.each([
			['Jan 2020 – Present', '2020-01'],
			['Jan 2020 – present', '2020-01'],
			['Jan 2020 – current', '2020-01'],
			['Jan 2020 – ongoing', '2020-01'],
		])(
			'parses "%s" with start datetime="%s" and wraps both dates',
			(input, expectedStart) => {
				const md = createMd()
				const html = md.renderInline(input)
				const doc = parseHtml(html)

				const timeTags = doc.querySelectorAll('time')
				expect(timeTags.length).toBe(2)
				expect(timeTags[0]?.getAttribute('datetime')).toBe(expectedStart)
			},
		)
	})

	describe('no dates', () => {
		it('leaves text without dates unchanged', () => {
			const md = createMd()
			const html = md.renderInline('Hello world')
			expect(html).toBe('Hello world')
			expect(html).not.toContain('<time')
		})

		it('escapes HTML special characters in non-date text', () => {
			const md = createMd()
			const html = md.renderInline('Hello <script>alert(1)</script>')
			expect(html).toContain('&lt;script&gt;')
			expect(html).not.toContain('<script>')
		})
	})

	describe('edge cases', () => {
		it('handles multiple dates in same text', () => {
			const md = createMd()
			const html = md.renderInline('From Jan 2020 to Dec 2024')
			const doc = parseHtml(html)

			// chrono-node should parse this as a range
			const timeTags = doc.querySelectorAll('time')
			expect(timeTags.length).toBeGreaterThanOrEqual(1)
		})

		it('handles text before and after date', () => {
			const md = createMd()
			const html = md.renderInline('Started Jan 2020 successfully')
			const doc = parseHtml(html)

			expect(html).toContain('Started ')
			expect(html).toContain(' successfully')

			const timeEl = doc.querySelector('time')
			expect(timeEl).toBeTruthy()
		})

		it('handles empty input', () => {
			const md = createMd()
			const html = md.renderInline('')
			expect(html).toBe('')
		})

		it('handles whitespace-only input', () => {
			const md = createMd()
			const html = md.renderInline('   ')
			expect(html).toBe('   ')
		})
	})

	describe('integration with markdown', () => {
		it('works in paragraph context', () => {
			const md = createMd()
			const html = md.render('I started in Jan 2020.')
			const doc = parseHtml(html)

			const timeEl = doc.querySelector('time')
			expect(timeEl).toBeTruthy()
			expect(timeEl?.getAttribute('datetime')).toBe('2020-01')
		})

		it('works in heading context', () => {
			const md = createMd()
			const html = md.render('### Software Engineer Jan 2020 – Present')
			const doc = parseHtml(html)

			const heading = doc.querySelector('h3')
			expect(heading).toBeTruthy()

			const timeEl = heading?.querySelector('time')
			expect(timeEl).toBeTruthy()
		})

		it('works in list item context', () => {
			const md = createMd()
			const html = md.render('- Started Jan 2020')
			const doc = parseHtml(html)

			const li = doc.querySelector('li')
			expect(li).toBeTruthy()

			const timeEl = li?.querySelector('time')
			expect(timeEl).toBeTruthy()
		})
	})
})
