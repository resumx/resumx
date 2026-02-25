/**
 * Filter By Role Processor
 *
 * Filters HTML content based on the active role.
 * Uses generic selector-based filtering with class attribute selectors.
 */

import { filterBySelector } from '../../../lib/dom-kit/content-filter.js'
import { resolveRoleSet } from '../../role-composition.js'
import type { PipelineContext } from '../types.js'

/**
 * Filter HTML to keep only content matching the active role
 *
 * - Elements with .@X where X matches activeRole (or its constituents) are KEPT
 * - Elements with .@X where X does NOT match are REMOVED
 * - Elements without any .@* class are KEPT (common content)
 *
 * When a roleMap is provided, the active role is expanded into its full
 * constituent set (e.g., fullstack -> {fullstack, frontend, backend}).
 */
export function filterByRole(html: string, ctx: PipelineContext): string {
	const { activeRole, roleMap } = ctx.config

	if (!activeRole) {
		return html
	}

	const roleSet = resolveRoleSet(activeRole, roleMap ?? {})
	const notClauses = [...roleSet]
		.map(role => `:not([class*="@${role}"])`)
		.join('')

	return filterBySelector(html, `[class*="@"]${notClauses}`)
}
