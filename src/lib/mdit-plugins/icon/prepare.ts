/**
 * Pre-resolve all icons in a markdown string and populate the cache.
 *
 * This module is resolver-agnostic: it scans for :name: patterns,
 * filters out cached entries, and runs an async resolver chain.
 * Each resolver owns its own resolution logic.
 */

import type { IconCache } from './cache.js'

/**
 * Match :name: or :prefix/name: patterns in markdown content.
 * Name segments are [a-zA-Z0-9_-]+. An optional `/` separates
 * prefix from name (Iconify format).
 * The (?!:) negative lookahead prevents matching inside ::text::.
 */
const ICON_PATTERN =
	/:([a-zA-Z0-9][a-zA-Z0-9_-]*(?:\/[a-zA-Z0-9][a-zA-Z0-9_-]*)?):(?!:)/g

/** Async resolver: resolves an icon name to self-contained HTML, or null. */
export type AsyncIconResolver = (name: string) => Promise<string | null>

/**
 * Scan markdown content for :icon: patterns, resolve uncached icons
 * via the async resolver chain, and store results in the cache.
 *
 * The prepare layer does not know how icons are resolved. It just
 * runs the resolvers and caches whatever they return.
 */
export async function prepareIcons(
	content: string,
	cache: IconCache,
	resolvers: AsyncIconResolver[],
): Promise<void> {
	const names = new Set<string>()
	let match
	ICON_PATTERN.lastIndex = 0
	while ((match = ICON_PATTERN.exec(content)) !== null) {
		const name = match[1]?.trim()
		if (name) names.add(name)
	}

	if (names.size === 0) return

	const uncached: string[] = []
	for (const name of names) {
		if (!cache.has(name)) {
			uncached.push(name)
		}
	}

	if (uncached.length === 0) return

	await Promise.all(
		uncached.map(async name => {
			for (const resolve of resolvers) {
				const html = await resolve(name)
				if (html != null) {
					cache.set(name, html)
					return
				}
			}
		}),
	)
}
