/**
 * Filter By Target Processor
 *
 * Filters HTML content based on the active target.
 * Uses generic selector-based filtering with class attribute selectors.
 */

import { filterBySelector } from '../../../lib/dom-kit/content-filter.js'
import { resolveTargetSet } from '../../target-composition.js'
import type { PipelineContext } from '../types.js'

/**
 * Filter HTML to keep only content matching the active target
 *
 * - Elements with .@X where X matches activeTarget (or its constituents) are KEPT
 * - Elements with .@X where X does NOT match are REMOVED
 * - Elements without any .@* class are KEPT (common content)
 *
 * When a targetMap is provided, the active target is expanded into its full
 * constituent set (e.g., fullstack -> {fullstack, frontend, backend}).
 */
export function filterByTarget(html: string, ctx: PipelineContext): string {
	const { activeTarget, targetMap } = ctx.config

	if (!activeTarget) {
		return html
	}

	const targetSet = resolveTargetSet(activeTarget, targetMap ?? {})
	const notClauses = [...targetSet]
		.map(target => `:not([class*="@${target}"])`)
		.join('')

	return filterBySelector(html, `[class*="@"]${notClauses}`)
}
