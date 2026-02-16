/**
 * Renderer for icon tokens: name → HTML via resolvers.
 *
 * Each resolver has two variants:
 * - Sync: reads from cache during markdown rendering (fast, no I/O)
 * - Async: fetches and produces self-contained HTML for cache population
 */

import { escapeHtml } from '@mdit/helper'
import { iconifyHtml, iconCache } from './utils.js'
import type { AsyncIconResolver } from './prepare.js'
import { fetchIconifySvgs, fetchImageAsDataUri } from './fetch.js'

/** Function that resolves an icon name to HTML, or returns null if it cannot. */
export type IconResolver = (name: string) => string | null

/**
 * Resolver spec used by the icon plugin.
 * - render: sync resolver used by markdown-it render path.
 * - prepare: optional async resolver used by renderAsync/renderInlineAsync prefetch.
 */
export interface IconResolverSpec {
	render: IconResolver
	prepare?: AsyncIconResolver
}

/** Resolver input accepted by plugin options. */
export type IconResolverInput = IconResolver | IconResolverSpec

/** Shared inline icon styles for img-based resolvers. */
const IMG_ICON_STYLE = 'display: inline-block;'

// ── URL builders (shared by sync and async variants) ────────────────────────

/** Extract the Wikimedia Commons URL from a wiki: or wikimedia-commons: name, or null. */
function wikiCommonsUrl(name: string): string | null {
	const trimmed = name.trim()
	let path: string | null = null

	if (trimmed.startsWith('wiki:')) {
		path = trimmed.slice(5)
	} else if (trimmed.startsWith('wikimedia-commons:')) {
		path = trimmed.slice(18)
	} else {
		return null
	}

	if (!path) return null
	return `https://upload.wikimedia.org/wikipedia/commons/${path}`
}

/** Extract the GitHub image URL from a gh: or github: name, or null. */
function githubImageUrl(name: string): string | null {
	const trimmed = name.trim()
	let path: string | null = null

	if (trimmed.startsWith('gh:')) {
		path = trimmed.slice(3)
	} else if (trimmed.startsWith('github:')) {
		path = trimmed.slice(7)
	} else {
		return null
	}

	if (!path) return null

	const segments = path.split('/')
	const owner = segments[0]
	if (!owner) return null

	if (segments.length <= 2) {
		return `https://github.com/${owner}.png`
	}
	return `https://raw.githubusercontent.com/${path}`
}

// ── Sync resolvers (read from cache during markdown rendering) ──────────────

/**
 * Resolves `wiki:path` or `wikimedia-commons:path` from the cache.
 * Returns cached data-URI HTML if available, otherwise falls back to external <img> tag.
 */
export function wikiCommonsResolver(name: string): string | null {
	const url = wikiCommonsUrl(name)
	if (!url) return null
	// Try cache first (data URI img from prepareIcons)
	const cached = iconCache.get(name.trim())
	if (cached) return cached
	// Fallback: external URL (will require network during render)
	return `<img src="${escapeHtml(url)}" alt="" class="icon wiki-icon" style="${IMG_ICON_STYLE}">`
}

/**
 * Resolves `gh:` or `github:` paths from the cache.
 * Returns cached data-URI HTML if available, otherwise falls back to external <img> tag.
 */
export function githubResolver(name: string): string | null {
	const url = githubImageUrl(name)
	if (!url) return null
	// Try cache first (data URI img from prepareIcons)
	const cached = iconCache.get(name.trim())
	if (cached) return cached
	// Fallback: external URL (will require network during render)
	return `<img src="${escapeHtml(url)}" alt="" class="icon gh-icon" style="${IMG_ICON_STYLE}">`
}

/**
 * Catch-all Iconify resolver. Returns cached inline SVG or null.
 * Only matches names with a colon (prefix:name format).
 */
export function iconifyResolver(name: string): string | null {
	return iconifyHtml(name)
}

// ── Async resolvers (fetch and produce self-contained HTML) ─────────────────

/**
 * Async resolver for wiki: / wikimedia-commons: icons.
 * Fetches the image and returns a data URI <img> tag.
 */
export function createAsyncWikiResolver(): AsyncIconResolver {
	return async (name: string): Promise<string | null> => {
		const url = wikiCommonsUrl(name)
		if (!url) return null
		return fetchImageAsDataUri(url, 'icon wiki-icon')
	}
}

/**
 * Async resolver for gh: / github: icons.
 * Fetches the image and returns a data URI <img> tag.
 */
export function createAsyncGithubResolver(): AsyncIconResolver {
	return async (name: string): Promise<string | null> => {
		const url = githubImageUrl(name)
		if (!url) return null
		return fetchImageAsDataUri(url, 'icon gh-icon')
	}
}

/**
 * Async catch-all Iconify resolver.
 * Fetches SVG from the Iconify API for any prefix:name format.
 */
export function createAsyncIconifyResolver(): AsyncIconResolver {
	return async (name: string): Promise<string | null> => {
		if (!name.includes(':')) return null
		const svgs = await fetchIconifySvgs([name])
		return svgs.get(name) ?? null
	}
}

/**
 * Converts resolver inputs into a standardized format with both sync and async variants.
 *
 * This function ensures every resolver has:
 * - `render`: A sync function that reads from cache during markdown rendering
 * - `prepare`: An optional async function that fetches icons to populate the cache
 *
 * For convenience, when you pass a built-in sync resolver (like `wikiCommonsResolver`),
 * this function automatically pairs it with its async counterpart.
 * This way you can just write `[wikiCommonsResolver]` instead of having to specify both variants manually.
 *
 * @example
 * // Input: just the sync function
 * normalizeResolverInputs([iconifyResolver])
 * // Output: { render: iconifyResolver, prepare: createAsyncIconifyResolver() }
 *
 * @example
 * // Input: already has both specified
 * normalizeResolverInputs([{ render: myResolver, prepare: myAsyncResolver }])
 * // Output: { render: myResolver, prepare: myAsyncResolver }
 *
 * @param resolvers - Array of resolver functions or resolver specs
 * @returns Array of normalized resolver specs with both render and prepare functions
 */
export function normalizeResolverInputs(
	resolvers: IconResolverInput[],
): IconResolverSpec[] {
	return resolvers.map(resolver => {
		if (typeof resolver === 'function') {
			return {
				render: resolver,
				prepare: defaultPrepareResolver(resolver) ?? undefined,
			}
		}

		return {
			render: resolver.render,
			prepare:
				resolver.prepare
				?? defaultPrepareResolver(resolver.render)
				?? undefined,
		}
	})
}

function defaultPrepareResolver(
	resolver: IconResolver,
): AsyncIconResolver | null {
	if (resolver === wikiCommonsResolver) return createAsyncWikiResolver()
	if (resolver === githubResolver) return createAsyncGithubResolver()
	if (resolver === iconifyResolver) return createAsyncIconifyResolver()
	return null
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
	resolvers?: IconResolverInput[]
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
	const resolvers = (options.resolvers ?? []).map(resolve =>
		typeof resolve === 'function' ? resolve : resolve.render,
	)

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
