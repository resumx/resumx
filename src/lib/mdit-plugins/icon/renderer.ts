/**
 * Renderer for icon tokens: name → HTML via resolvers.
 * Includes built-in renderers: Iconify, Font Awesome, and createCustomResolver.
 */

import { escapeHtml } from '@mdit/helper'
import { deviconMap } from './mappings/devicon.js'
import { logosMap } from './mappings/logos.js'
import { iconifyHtml } from './utils.js'

/** Function that resolves an icon name to HTML, or returns null if it cannot. */
export type IconResolver = (name: string) => string | null

/** Shared inline icon styles for img-based resolvers. */
const IMG_ICON_STYLE = 'display: inline-block;'

/**
 * Resolves `wiki:path` or `wikimedia-commons:path` to an `<img>` tag loading from Wikimedia Commons.
 * Example: `wiki:f/f1/PwC_2025_Logo.svg` → `<img src="https://upload.wikimedia.org/wikipedia/commons/f/f1/PwC_2025_Logo.svg" ...>`
 *
 * @param name - Icon name, expected format: `wiki:<hash-path>/<filename>` or `wikimedia-commons:<hash-path>/<filename>`.
 * @returns HTML `<img>` string if name starts with `wiki:` or `wikimedia-commons:`, otherwise null.
 */
export function wikiCommonsResolver(name: string): string | null {
	const trimmed = name.trim()
	let path: string | null = null

	if (trimmed.startsWith('wiki:')) {
		path = trimmed.slice(5) // Remove 'wiki:' prefix
	} else if (trimmed.startsWith('wikimedia-commons:')) {
		path = trimmed.slice(18) // Remove 'wikimedia-commons:' prefix
	} else {
		return null
	}

	if (!path) return null
	const url = `https://upload.wikimedia.org/wikipedia/commons/${escapeHtml(path)}`
	return `<img src="${url}" alt="" class="icon wiki-icon" style="${IMG_ICON_STYLE}">`
}

/**
 * Resolves `gh:` or `github:` paths to GitHub images.
 * - `gh:owner` or `gh:owner/repo` → owner's avatar (`https://github.com/owner.png`)
 * - `gh:owner/repo/branch/path...` → raw file (`https://raw.githubusercontent.com/owner/repo/branch/path...`)
 *
 * @param name - Icon name, expected format: `gh:<owner>` or `github:<owner>` or `gh:<owner>/<repo>/<branch>/<path>`.
 * @returns HTML `<img>` string if name starts with `gh:` or `github:`, otherwise null.
 */
export function githubResolver(name: string): string | null {
	const trimmed = name.trim()
	let path: string | null = null

	if (trimmed.startsWith('gh:')) {
		path = trimmed.slice(3) // Remove 'gh:' prefix
	} else if (trimmed.startsWith('github:')) {
		path = trimmed.slice(7) // Remove 'github:' prefix
	} else {
		return null
	}

	if (!path) return null

	const segments = path.split('/')
	const owner = segments[0]
	if (!owner) return null

	// 1-2 segments: avatar (owner or owner/repo → use owner's avatar)
	// 3+ segments: raw file (owner/repo/branch/path...)
	if (segments.length <= 2) {
		return `<img src="https://github.com/${escapeHtml(owner)}.png" alt="" class="icon gh-icon" style="${IMG_ICON_STYLE}">`
	}

	// Raw file: owner/repo/branch/path...
	const url = `https://raw.githubusercontent.com/${escapeHtml(path)}`
	return `<img src="${url}" alt="" class="icon gh-icon" style="${IMG_ICON_STYLE}">`
}

/**
 * Resolves resume-specific icon aliases (e.g. "react", "python") to their Iconify icon implementations.
 * These are user-friendly names defined by resum8, not Iconify icon names directly.
 * Checks devicon first, then logos.
 */
export const resumxIconResolver = (name: string): string | null =>
	deviconMap[name] ?? logosMap[name] ?? null

/**
 * Renders an icon via [Iconify](https://iconify.design/). Use icon id e.g. `mdi:home`, `fa6-brands:react`.
 *
 * @param name - Iconify id (set:name). Trimmed and escaped.
 * @returns HTML string: `<iconify-icon icon="..." style="..."></iconify-icon>`.
 */
export function iconifyResolver(name: string): string {
	return iconifyHtml(name)
}

/**
 * Returns a resolver that looks up the icon name in the given map (e.g. name → SVG HTML).
 *
 * @param map - Icon name to HTML. Keys are matched after trimming.
 * @returns An IconResolver that returns the map value or null.
 */
export function createCustomResolver(
	map: Record<string, string>,
): IconResolver {
	return (name: string) => map[name.trim()] ?? null
}

/** Options for the icon plugin. */
export interface MarkdownItIconOptions {
	/** Resolvers tried in order; first non-null wins. Falls back to `::name::` if none match. */
	resolvers?: IconResolver[]
}

/**
 * Builds a function that turns icon content (name) into HTML using resolvers, then fallback.
 *
 * @param options - Plugin options: resolvers.
 * @returns A function (content: string) => HTML string.
 */
export function buildRender(
	options: MarkdownItIconOptions,
): (content: string) => string {
	const resolvers = options.resolvers ?? []

	return (content: string) => {
		const name = content.trim()
		for (const resolve of resolvers) {
			const html = resolve(name)
			if (html != null) return html
		}
		// Hard-coded fallback: preserve original syntax
		return `::${escapeHtml(name)}::`
	}
}

/**
 * Returns the markdown-it render rule for `icon` tokens: calls render with the token's content.
 *
 * @param render - Function that turns icon name (content) into HTML.
 * @returns A rule function (tokens, idx) => string for use as `md.renderer.rules['icon']`.
 */
export function createIconRenderRule(
	render: (content: string) => string,
): (tokens: { content?: string }[], idx: number) => string {
	return (tokens, idx) => render(tokens[idx]?.content ?? '')
}
