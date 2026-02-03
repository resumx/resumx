/**
 * markdown-it plugin for automatic time parsing
 *
 * Uses chrono-node to detect dates in text and wrap them with semantic
 * HTML5 <time> tags. Date ranges use two separate <time> tags wrapped
 * in a <span class="date-range"> for easier styling.
 *
 * Examples:
 *   "Jan 2020" → <time datetime="2020-01">Jan 2020</time>
 *   "Jan 2020 – Dec 2024" → <span class="date-range"><time datetime="2020-01">Jan 2020</time> – <time datetime="2024-12">Dec 2024</time></span>
 *   "2020 – Present" → <span class="date-range"><time datetime="2020">2020</time> – <time datetime="2026-02-03">Present</time></span>
 */

import * as chrono from 'chrono-node'
import type MarkdownIt from 'markdown-it'
import type {
	ParsedComponents,
	ParsedResult,
	ParsingContext,
} from 'chrono-node'
import { escapeHtml } from '@mdit/helper'

/**
 * Add custom parsers to a chrono instance
 */
function addCustomParsers(instance: chrono.Chrono): void {
	// Parser for "current" keywords (Present, Current, ongoing, etc.)
	// These resolve to today's date
	instance.parsers.push({
		pattern: () => /\b(present|current|ongoing|至今|現在|现在)\b/i,
		extract: (context: ParsingContext) => {
			const now = context.refDate
			return {
				day: now.getDate(),
				month: now.getMonth() + 1,
				year: now.getFullYear(),
			}
		},
	})
}

/**
 * Create custom chrono instances:
 * - One that merges date ranges (for detecting ranges)
 * - One without merge refiner (for getting individual date positions)
 */
function createChronoInstances(): {
	withMerge: chrono.Chrono
	withoutMerge: chrono.Chrono
} {
	const withMerge = chrono.casual.clone()
	addCustomParsers(withMerge)
	// Remove filters that reject year-only dates
	withMerge.refiners = withMerge.refiners.filter(
		r =>
			!r.constructor.name.includes('Unlikely')
			&& !r.constructor.name.includes('Filter'),
	)

	const withoutMerge = chrono.casual.clone()
	addCustomParsers(withoutMerge)
	// Remove filters and the date range merger
	withoutMerge.refiners = withoutMerge.refiners.filter(
		r =>
			!r.constructor.name.includes('Unlikely')
			&& !r.constructor.name.includes('Filter')
			&& r.constructor.name !== 'ENMergeDateRangeRefiner',
	)

	return { withMerge, withoutMerge }
}

// Create chrono instances once
const { withMerge: chronoWithMerge, withoutMerge: chronoWithoutMerge } =
	createChronoInstances()

/**
 * Format a ParsedComponents to ISO 8601 date string with appropriate precision
 * - Year only if month not certain: "2020"
 * - Year-month if day not certain: "2020-01"
 * - Full date if all certain: "2020-01-15"
 */
function formatToIso(component: ParsedComponents): string {
	const year = component.get('year')
	const month = component.get('month')
	const day = component.get('day')

	if (year === null) return ''

	// If month wasn't explicitly specified, return year only
	if (!component.isCertain('month')) {
		return `${year}`
	}

	// If day wasn't explicitly specified, return year-month
	if (!component.isCertain('day')) {
		return `${year}-${String(month).padStart(2, '0')}`
	}

	// Return full date
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Format a single time tag
 */
function formatTimeTag(datetime: string, content: string): string {
	return `<time datetime="${datetime}">${escapeHtml(content)}</time>`
}

/**
 * Process a chrono ParsedResult and return the appropriate HTML
 */
function formatResult(result: ParsedResult): string {
	const startIso = formatToIso(result.start)

	// If no valid start date, return original text escaped
	if (!startIso) {
		return escapeHtml(result.text)
	}

	// Check if this is a date range (chrono parsed both start and end)
	if (result.end) {
		const endIso = formatToIso(result.end)

		// Parse without merge to get individual date positions
		const individualDates = chronoWithoutMerge.parse(result.text)

		if (individualDates.length >= 2 && endIso) {
			const first = individualDates[0]
			const second = individualDates[1]

			if (first && second) {
				const startText = first.text
				const startEnd = first.index + first.text.length
				const endStart = second.index
				const endText = second.text

				// Whatever is between the two dates is the separator
				const separator = result.text.slice(startEnd, endStart)

				return (
					`<span class="date-range">`
					+ formatTimeTag(startIso, startText)
					+ escapeHtml(separator)
					+ formatTimeTag(endIso, endText)
					+ `</span>`
				)
			}
		}
	}

	// Single date
	return formatTimeTag(startIso, result.text)
}

/**
 * Wrap dates in text with <time> tags
 */
function wrapDatesInTimeTag(text: string): string {
	// Parse all dates from text (with range merging for proper range detection)
	const results = chronoWithMerge.parse(text)

	if (results.length === 0) {
		return escapeHtml(text)
	}

	// Sort by index to process in order
	const sorted = [...results].sort((a, b) => a.index - b.index)

	let output = ''
	let lastEnd = 0

	for (const result of sorted) {
		// Skip if this result overlaps with previously processed text
		if (result.index < lastEnd) {
			continue
		}

		// Add escaped text before this match
		if (result.index > lastEnd) {
			output += escapeHtml(text.slice(lastEnd, result.index))
		}

		// Format the date
		output += formatResult(result)

		lastEnd = result.index + result.text.length
	}

	// Add any remaining text after the last match
	if (lastEnd < text.length) {
		output += escapeHtml(text.slice(lastEnd))
	}

	return output
}

/**
 * markdown-it plugin that wraps detected dates in <time> tags
 */
export function timePlugin(md: MarkdownIt): void {
	// Store the original text renderer
	const defaultTextRenderer =
		md.renderer.rules.text
		|| ((tokens, idx) => {
			const token = tokens[idx]
			return token ? md.utils.escapeHtml(token.content) : ''
		})

	// Override text renderer to wrap dates
	md.renderer.rules.text = (tokens, idx, options, env, self) => {
		const token = tokens[idx]
		if (!token) {
			return ''
		}
		const content = token.content

		// Skip if empty
		if (!content || content.trim() === '') {
			return defaultTextRenderer(tokens, idx, options, env, self)
		}

		// Process dates
		return wrapDatesInTimeTag(content)
	}
}

export default timePlugin
