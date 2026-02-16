/**
 * Shared icon cache instance and utility functions.
 *
 * The cache is a singleton used by both prepareIcons() (async, populates)
 * and the sync resolvers during markdown rendering (reads).
 */

import { join } from 'node:path'
import { homedir } from 'node:os'
import { IconCache } from './cache.js'

/** Default cache directory: ~/.cache/resumx/icons */
const DEFAULT_CACHE_DIR = join(homedir(), '.cache', 'resumx', 'icons')

/** Singleton cache instance shared across the entire render pipeline. */
export const iconCache = new IconCache(DEFAULT_CACHE_DIR)

/**
 * Look up an icon by name from the shared cache.
 * Returns cached HTML (inline SVG or data URI) or null if not cached.
 *
 * This replaces the old iconifyHtml() that generated <span> placeholders.
 * Now it's a pure cache read; the actual resolution happens in prepareIcons().
 */
export function iconifyHtml(name: string): string | null {
	return iconCache.get(name.trim())
}
