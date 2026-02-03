/**
 * Roles SDK - Pure functions for role-based content filtering
 *
 * This module provides functions to:
 * - Extract role names from HTML content
 * - Filter HTML to keep only content matching a specific role
 * - Resolve which roles to generate based on priority
 *
 * These functions are independent of CLI logic and can be used programmatically.
 */

import { parseHTML } from 'linkedom'

/**
 * Regular expression to match role:name classes
 * Matches patterns like: role:frontend, role:backend, role:ui-design
 */
const ROLE_CLASS_PATTERN = /\brole:([^\s"']+)/g

/**
 * Extract all unique role names from HTML content.
 * Scans for class="role:xxx" patterns.
 *
 * @param html - HTML string to scan
 * @returns Array of unique role names (e.g., ['frontend', 'backend', 'fullstack'])
 *
 * @example
 * extractRoles('<div class="role:frontend">...</div>') // ['frontend']
 * extractRoles('<li class="role:frontend role:fullstack">...</li>') // ['frontend', 'fullstack']
 */
export function extractRoles(html: string): string[] {
	if (!html) return []

	const roles = new Set<string>()
	// Wrap in container for linkedom to parse correctly
	const { document } = parseHTML(`<div id="__roles_root__">${html}</div>`)
	const root = document.getElementById('__roles_root__')
	if (!root) return []

	// Find all elements with class attribute containing "role:"
	const elements = Array.from(root.querySelectorAll('[class*="role:"]'))

	for (const element of elements) {
		const classAttr = element.getAttribute('class') ?? ''
		let match

		// Reset regex state
		ROLE_CLASS_PATTERN.lastIndex = 0

		while ((match = ROLE_CLASS_PATTERN.exec(classAttr)) !== null) {
			if (match[1]) {
				roles.add(match[1])
			}
		}
	}

	return Array.from(roles)
}

/**
 * Filter HTML to keep only content matching the active role.
 *
 * - Elements with .role:X where X matches activeRole are KEPT
 * - Elements with .role:X where X does NOT match activeRole are REMOVED
 * - Elements without any .role:* class are KEPT (common content)
 *
 * @param html - HTML string to filter
 * @param activeRole - Role to keep (e.g., 'frontend')
 * @returns Filtered HTML string
 *
 * @example
 * filterByRole(html, 'frontend')
 */
export function filterByRole(html: string, activeRole: string): string {
	if (!html) return ''

	// Wrap in container for linkedom to parse correctly
	const { document } = parseHTML(`<div id="__roles_root__">${html}</div>`)
	const root = document.getElementById('__roles_root__')
	if (!root) return ''

	// Find all elements with any role class
	const elements = Array.from(root.querySelectorAll('[class*="role:"]'))

	// Collect elements to remove (we can't modify while iterating)
	const toRemove: Element[] = []

	for (const element of elements) {
		const classAttr = element.getAttribute('class') ?? ''

		// Check if this element has the active role
		const hasActiveRole = classAttr.includes(`role:${activeRole}`)

		if (!hasActiveRole) {
			toRemove.push(element)
		}
	}

	// Remove elements that don't match
	for (const element of toRemove) {
		element.remove()
	}

	// Return the modified HTML (innerHTML of our wrapper)
	return root.innerHTML
}

/**
 * Options for resolving which roles to generate
 */
export interface ResolveRolesOptions {
	/** CLI-specified roles (highest priority, defaults to []) */
	explicit?: string[]
	/** Frontmatter-configured roles (defaults to []) */
	configured?: string[]
	/** Auto-discovered roles from content */
	discovered: string[]
}

/**
 * Determine which roles to generate based on priority.
 * Priority order: explicit > configured > discovered
 *
 * @param options - Object containing explicit, configured, and discovered roles
 * @returns Array of roles to generate
 * @throws Error if any specified role (explicit or configured) does not exist in discovered roles
 *
 * @example
 * resolveRoles({ explicit: ['frontend'], discovered: ['frontend'] }) // ['frontend']
 * resolveRoles({ configured: ['a', 'b'], discovered: ['a', 'b', 'c'] }) // ['a', 'b']
 * resolveRoles({ discovered: ['a', 'b'] }) // ['a', 'b']
 */
export function resolveRoles(options: ResolveRolesOptions): string[] {
	const { explicit = [], configured = [], discovered } = options

	// Helper to format available roles message
	const formatAvailableRoles = () =>
		discovered.length > 0 ?
			`Available roles: ${discovered.join(', ')}`
		:	'No roles found in content'

	// Helper to validate roles exist in discovered
	const validateRoles = (roles: string[]) => {
		const invalidRoles = roles.filter(role => !discovered.includes(role))
		if (invalidRoles.length > 0) {
			const roleList =
				invalidRoles.length === 1 ?
					`role '${invalidRoles[0]}'`
				:	`roles '${invalidRoles.join("', '")}'`
			throw new Error(`${roleList} does not exist. ${formatAvailableRoles()}`)
		}
	}

	// Priority 1: Explicit CLI flags (with validation)
	if (explicit.length > 0) {
		validateRoles(explicit)
		return explicit
	}

	// Priority 2: Configured in frontmatter (if non-empty, with validation)
	if (configured.length > 0) {
		validateRoles(configured)
		return configured
	}

	// Priority 3: Auto-discovered from content
	return discovered
}
