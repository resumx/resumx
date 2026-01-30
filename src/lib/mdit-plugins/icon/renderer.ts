/**
 * Renderer for icon tokens: name → HTML via resolvers.
 * Includes built-in renderers: Iconify, Font Awesome, and createCustomResolver.
 */

import { escapeHtml } from '@mdit/helper'

/** Function that resolves an icon name to HTML, or returns null if it cannot. */
export type IconResolver = (name: string) => string | null

/**
 * Renders an icon via [Iconify](https://iconify.design/). Use icon id e.g. `mdi:home`, `fa6-brands:react`.
 *
 * @param name - Iconify id (set:name). Trimmed and escaped.
 * @returns HTML string: `<iconify-icon icon="..." style="..."></iconify-icon>`.
 */
export function iconifyRender(name: string): string {
	const content = name.trim()
	return `<iconify-icon icon="${escapeHtml(content)}" style="vertical-align: -0.125em; display: inline-block;"></iconify-icon>`
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
