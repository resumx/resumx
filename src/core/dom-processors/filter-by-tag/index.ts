/**
 * Filter By Tag Processor
 *
 * Filters HTML content based on the active tag.
 * Uses generic selector-based filtering with class attribute selectors.
 */

import { filterBySelector } from '../../../lib/dom-kit/content-filter.js'
import { resolveTagSet } from '../../target-composition.js'
import type { PipelineContext } from '../types.js'

/**
 * Filter HTML to keep only content matching the active tag
 *
 * - Elements with .@X where X matches activeTag (or its constituents) are KEPT
 * - Elements with .@X where X does NOT match are REMOVED
 * - Elements without any .@* class are KEPT (common content)
 *
 * When a tagMap is provided, the active tag is expanded into its full
 * constituent set (e.g., fullstack -> {fullstack, frontend, backend}).
 */
export function filterByTag(html: string, ctx: PipelineContext): string {
	const { activeTag, tagMap } = ctx.config

	if (!activeTag) {
		return html
	}

	const tagSet = resolveTagSet(activeTag, tagMap ?? {})
	const notClauses = [...tagSet].map(tag => `:not([class*="@${tag}"])`).join('')

	return filterBySelector(html, `[class*="@"]${notClauses}`)
}
