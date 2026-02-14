/**
 * Filter By Role Processor
 *
 * Filters HTML content based on the active role.
 * Uses generic selector-based filtering with class attribute selectors.
 */

import { filterBySelector } from '../../content-filter.js'
import type { PipelineContext } from '../types.js'

/**
 * Filter HTML to keep only content matching the active role
 *
 * - Elements with .role:X where X matches activeRole are KEPT
 * - Elements with .role:X where X does NOT match activeRole are REMOVED
 * - Elements without any .role:* class are KEPT (common content)
 *
 * @param html - Input HTML string
 * @param ctx - Pipeline context (uses ctx.config.activeRole)
 * @returns Filtered HTML string, or unchanged if no activeRole specified
 */
export function filterByRole(html: string, ctx: PipelineContext): string {
	const { activeRole } = ctx.config

	// If no active role, return unchanged
	if (!activeRole) {
		return html
	}

	return filterBySelector(
		html,
		`[class*="role:"]:not([class*="role:${activeRole}"])`,
	)
}
