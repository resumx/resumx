/**
 * Filter By Lang Processor
 *
 * Filters HTML content based on the active language.
 * Uses generic selector-based filtering with [lang] attribute selectors.
 */

import { filterBySelector } from '../../content-filter.js'
import type { PipelineContext } from '../types.js'

/**
 * Filter HTML to keep only content matching the active language
 *
 * - Elements with lang=X where X matches activeLang are KEPT
 * - Elements with lang=X where X does NOT match activeLang are REMOVED
 * - Elements without any lang attribute are KEPT (common content)
 *
 * @param html - Input HTML string
 * @param ctx - Pipeline context (uses ctx.config.activeLang)
 * @returns Filtered HTML string, or unchanged if no activeLang specified
 */
export function filterByLang(html: string, ctx: PipelineContext): string {
	const { activeLang } = ctx.config

	// If no active language, return unchanged
	if (!activeLang) {
		return html
	}

	return filterBySelector(html, `[lang]:not([lang="${activeLang}"])`)
}
