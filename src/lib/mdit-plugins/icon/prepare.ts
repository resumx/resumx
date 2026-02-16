/**
 * Pre-resolve all icons in a markdown string and populate the cache.
 *
 * This module is resolver-agnostic: it scans for ::name:: patterns,
 * filters out cached entries, and runs an async resolver chain.
 * Each resolver owns its own resolution logic.
 */

import type { IconCache } from './cache.js'

/**
 * Match ::name:: patterns in markdown content.
 * Allows colons in the name (e.g. ::mdi:home::, ::gh:facebook::).
 * Must not start with space/colon, must not end with space.
 * Uses non-greedy match to find the closest `::` pair.
 */
const ICON_PATTERN = /::([^\s:][^\s]*?)::/g

/** Async resolver: resolves an icon name to self-contained HTML, or null. */
export type AsyncIconResolver = (name: string) => Promise<string | null>

/**
 * Scan markdown content for ::icon:: patterns, resolve uncached icons
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
	// 1. Extract all unique icon names
	const names = new Set<string>()
	let match
	ICON_PATTERN.lastIndex = 0
	while ((match = ICON_PATTERN.exec(content)) !== null) {
		const name = match[1]?.trim()
		if (name) names.add(name)
	}

	if (names.size === 0) return

	// 2. Filter out already-cached names
	const uncached: string[] = []
	for (const name of names) {
		if (!cache.has(name)) {
			uncached.push(name)
		}
	}

	if (uncached.length === 0) return

	// 3. Resolve each uncached name via the async resolver chain
	await Promise.all(
		uncached.map(async name => {
			for (const resolve of resolvers) {
				const html = await resolve(name)
				if (html != null) {
					cache.set(name, html)
					return
				}
			}
			// No resolver matched - leave uncached (will fall through to ::name:: at render time)
		}),
	)
}
