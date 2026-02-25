/**
 * Content Filter - Generic CSS selector-based content filtering
 *
 * Provides functions to:
 * - Extract values from HTML elements matching a CSS selector
 * - Filter HTML by removing elements that don't match a CSS selector
 * - Resolve which values to generate with validation
 *
 * These generic functions power language and target filtering,
 * using CSS selectors to define the matching strategy.
 */

import { parseHTML } from 'linkedom'

/**
 * Filter HTML by removing all elements matching the given CSS selector.
 *
 * Elements that don't match are left untouched (common content).
 * Use CSS `:not()` to express "remove tagged elements that aren't X".
 *
 * @param html - HTML string to filter
 * @param removeSelector - CSS selector for elements to remove
 * @returns Filtered HTML string
 *
 * @example
 * filterBySelector(html, '[lang]:not([lang="en"])')
 * filterBySelector(html, '[class*="@"]:not([class*="@frontend"])')
 */
export function filterBySelector(html: string, removeSelector: string): string {
	if (!html) return ''

	const { document } = parseHTML(`<div id="__filter_root__">${html}</div>`)
	const root = document.getElementById('__filter_root__')
	if (!root) return ''

	for (const element of Array.from(root.querySelectorAll(removeSelector))) {
		element.remove()
	}

	return root.innerHTML
}

/**
 * Extract unique values from HTML elements matching a CSS selector.
 *
 * @param html - HTML string to scan
 * @param selector - CSS selector for elements to inspect
 * @param getValue - Callback to extract values from each matched element
 * @returns Array of unique values
 *
 * @example
 * extractBySelector(html, '[lang]', el => {
 *   const v = el.getAttribute('lang')
 *   return v ? [v] : []
 * })
 */
export function extractBySelector(
	html: string,
	selector: string,
	getValue: (el: Element) => string[],
): string[] {
	if (!html) return []

	const { document } = parseHTML(`<div id="__extract_root__">${html}</div>`)
	const root = document.getElementById('__extract_root__')
	if (!root) return []

	const values = new Set<string>()
	const elements = Array.from(root.querySelectorAll(selector))

	for (const element of elements) {
		for (const value of getValue(element)) {
			values.add(value)
		}
	}

	return Array.from(values)
}

/**
 * Validate explicit values against discovered values.
 * Returns explicit if provided, otherwise returns discovered.
 *
 * @param explicit - User-specified values (e.g., from CLI flags)
 * @param discovered - Auto-discovered values from content
 * @param dimensionName - Name used in error messages (e.g., 'language', 'target')
 * @returns Array of values to use
 * @throws Error if any explicit value does not exist in discovered
 *
 * @example
 * resolveValues(['en'], ['en', 'fr'], 'language')
 * resolveValues([], ['frontend', 'backend'], 'target')
 */
export function resolveValues(
	explicit: string[],
	discovered: string[],
	dimensionName: string,
): string[] {
	if (explicit.length === 0) {
		return discovered
	}

	const invalid = explicit.filter(v => !discovered.includes(v))
	if (invalid.length > 0) {
		const label =
			invalid.length === 1 ?
				`${dimensionName} '${invalid[0]}'`
			:	`${dimensionName}s '${invalid.join("', '")}'`
		const available =
			discovered.length > 0 ?
				`Available ${dimensionName}s: ${discovered.join(', ')}`
			:	`No ${dimensionName}s found in content`
		throw new Error(`${label} does not exist. ${available}`)
	}

	return explicit
}
