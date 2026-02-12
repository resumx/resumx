/**
 * Langs SDK - Pure functions for language-based content filtering
 *
 * This module provides functions to:
 * - Extract language tags from HTML content
 * - Filter HTML to keep only content matching a specific language
 * - Resolve which languages to generate based on priority
 *
 * Uses the standard HTML `lang` attribute (BCP 47 tags).
 * These functions are independent of CLI logic and can be used programmatically.
 */

import { parseHTML } from 'linkedom'

/**
 * Extract all unique language tags from HTML content.
 * Scans for lang="xx" attributes on elements.
 *
 * @param html - HTML string to scan
 * @returns Array of unique language tags (e.g., ['en', 'fr', 'zh-CN'])
 *
 * @example
 * extractLangs('<span lang="en">Hello</span>') // ['en']
 * extractLangs('<span lang="en">Hello</span><span lang="fr">Bonjour</span>') // ['en', 'fr']
 */
export function extractLangs(html: string): string[] {
	if (!html) return []

	const langs = new Set<string>()
	const { document } = parseHTML(html)
	const elements = Array.from(document.querySelectorAll('[lang]'))

	for (const element of elements) {
		const lang = element.getAttribute('lang')
		if (lang) {
			langs.add(lang)
		}
	}

	return Array.from(langs)
}

/**
 * Filter HTML to keep only content matching the active language.
 *
 * - Elements with lang=X where X matches activeLang are KEPT
 * - Elements with lang=X where X does NOT match activeLang are REMOVED
 * - Elements without any lang attribute are KEPT (common content)
 *
 * @param html - HTML string to filter
 * @param activeLang - Language tag to keep (e.g., 'en')
 * @returns Filtered HTML string
 *
 * @example
 * filterByLang(html, 'en')
 */
export function filterByLang(html: string, activeLang: string): string {
	if (!html) return ''

	const { document } = parseHTML(`<div id="__langs_root__">${html}</div>`)
	const root = document.getElementById('__langs_root__')
	if (!root) return ''

	// Find all elements with a lang attribute
	const elements = Array.from(root.querySelectorAll('[lang]'))

	// Collect elements to remove (can't modify while iterating)
	const toRemove: Element[] = []

	for (const element of elements) {
		const lang = element.getAttribute('lang')

		if (lang !== activeLang) {
			toRemove.push(element)
		}
	}

	// Remove elements that don't match
	for (const element of toRemove) {
		element.remove()
	}

	return root.innerHTML
}

/**
 * Determine which languages to generate.
 * If explicit langs are provided (CLI), use those (with validation).
 * Otherwise, use all discovered langs from content.
 *
 * @param explicit - CLI-specified languages (e.g., from --lang flag)
 * @param discovered - Auto-discovered languages from content
 * @returns Array of languages to generate
 * @throws Error if any explicit language does not exist in discovered languages
 *
 * @example
 * resolveLangs(['en'], ['en', 'fr']) // ['en']
 * resolveLangs([], ['en', 'fr']) // ['en', 'fr']
 */
export function resolveLangs(
	explicit: string[],
	discovered: string[],
): string[] {
	if (explicit.length === 0) {
		return discovered
	}

	const invalidLangs = explicit.filter(lang => !discovered.includes(lang))
	if (invalidLangs.length > 0) {
		const langList =
			invalidLangs.length === 1 ?
				`language '${invalidLangs[0]}'`
			:	`languages '${invalidLangs.join("', '")}'`
		const available =
			discovered.length > 0 ?
				`Available languages: ${discovered.join(', ')}`
			:	'No languages found in content'
		throw new Error(`${langList} does not exist. ${available}`)
	}

	return explicit
}
