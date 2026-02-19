/**
 * Renderer for icon tokens: name -> HTML via resolvers.
 *
 * Each resolver has two variants:
 * - Sync: reads from cache during markdown rendering (fast, no I/O)
 * - Async: fetches and produces self-contained HTML for cache population
 */

import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { escapeHtml } from '@mdit/helper'
import { optimize, type Config } from 'svgo'
import emojiData from 'markdown-it-emoji/lib/data/full.mjs'
import { iconifyHtml } from './utils.js'
import type { AsyncIconResolver } from './prepare.js'
import { fetchIconifySvgs } from './fetch.js'

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

// ── SVG sanitization (SVGO) ─────────────────────────────────────────────────

const SVGO_CONFIG: Config = {
	plugins: [
		'removeXMLProcInst',
		'removeComments',
		'removeDoctype',
		{ name: 'inlineStyles', params: { onlyMatchedOnce: false } },
		'convertStyleToAttrs',
		'removeStyleElement',
		'removeDimensions',
	],
}

// ── SVG wrapping ────────────────────────────────────────────────────────────

/**
 * Wrap a clean SVG string in `<span class="icon">`.
 *
 * The span provides the `.icon` styling (height: 1em, vertical-align, etc.)
 * and the inner SVG scales via CSS (`span.icon > svg { height: 100%; width: auto }`).
 * The SVG itself is never modified.
 */
export function wrapIconSvg(svg: string): string {
	return `<span class="icon">${svg}</span>`
}

// ── Frontmatter icons (processed per render, passed via env) ────────────────

/** Render environment carrying per-render icon overrides. */
export interface IconEnv {
	/** Icon overrides from frontmatter (slug -> SVG/URL/base64). Processed internally by the plugin. */
	iconOverrides?: Record<string, string>
	/** Processed icon HTML, populated internally by renderAsync. */
	frontmatterIcons?: Map<string, string>
}

/**
 * Process a raw frontmatter icon value into ready-to-use HTML.
 *
 * Accepts:
 * - Raw SVG: `<svg ...>...</svg>` - used as-is with icon class added
 * - URL: `https://...` or `http://...` - fetched and inlined as data URI
 * - Data URI: `data:...` - wrapped in <img>
 * - Other: treated as raw HTML content
 */
async function processIconValue(value: string): Promise<string> {
	const trimmed = value.trim()

	if (
		trimmed.startsWith('<svg')
		|| trimmed.startsWith('<SVG')
		|| trimmed.startsWith('<?xml')
	) {
		return wrapIconSvg(optimize(trimmed, SVGO_CONFIG).data)
	}

	if (trimmed.startsWith('data:')) {
		return `<img src="${escapeHtml(trimmed)}" alt="" class="icon" style="${IMG_ICON_STYLE}">`
	}

	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		const dataUri = await fetchAsDataUri(trimmed)
		if (dataUri) {
			return `<img src="${dataUri}" alt="" class="icon" style="${IMG_ICON_STYLE}">`
		}
		return `<img src="${escapeHtml(trimmed)}" alt="" class="icon" style="${IMG_ICON_STYLE}">`
	}

	return trimmed
}

/**
 * Fetch a URL and return it as a data URI string, or null on failure.
 */
async function fetchAsDataUri(url: string): Promise<string | null> {
	try {
		const response = await fetch(url)
		if (!response.ok) return null

		const contentType = response.headers.get('content-type') ?? 'image/png'
		const mime = contentType.split(';')[0]?.trim() ?? 'image/png'
		const buffer = await response.arrayBuffer()
		const base64 = Buffer.from(buffer).toString('base64')
		return `data:${mime};base64,${base64}`
	} catch {
		return null
	}
}

/**
 * Process raw frontmatter icon entries into a ready-to-use Map.
 * URL values are fetched and converted to inline data URIs.
 */
export async function processFrontmatterIcons(
	icons: Record<string, string>,
): Promise<Map<string, string>> {
	const entries = await Promise.all(
		Object.entries(icons).map(async ([k, v]) => {
			const html = await processIconValue(v)
			return [k.trim(), html] as const
		}),
	)
	return new Map(entries)
}

// ── Assets resolver (bundled SVG files) ─────────────────────────────────────

/**
 * Create a resolver that reads SVG files from a local directory.
 * Looks up `{dir}/{name}.svg` and returns inline SVG HTML.
 *
 * @param dir - Absolute path to the icons directory
 * @returns An IconResolver that reads local SVGs or returns null
 */
export function createAssetsResolver(dir: string): IconResolver {
	return (name: string): string | null => {
		const trimmed = name.trim()

		// Skip names with slash (Iconify prefix/name format)
		if (trimmed.includes('/')) return null

		const svgPath = join(dir, `${trimmed}.svg`)
		if (!existsSync(svgPath)) return null

		const svg = readFileSync(svgPath, 'utf-8').trim()
		return wrapIconSvg(svg)
	}
}

// ── Sync resolvers (read from cache during markdown rendering) ──────────────

/**
 * Catch-all Iconify resolver. Returns cached inline SVG or null.
 * Only matches names with a slash (prefix/name format).
 */
export function iconifyResolver(name: string): string | null {
	return iconifyHtml(name)
}

/**
 * Emoji resolver: maps shortcode names to unicode emoji characters.
 * Used as a fallback after icon resolvers, so :rocket: renders as the emoji
 * when no icon named "rocket" exists.
 */
export function emojiResolver(name: string): string | null {
	return emojiData[name.trim()] ?? null
}

// ── Async resolvers (fetch and produce self-contained HTML) ─────────────────

/**
 * Async catch-all Iconify resolver.
 * Fetches SVG from the Iconify API for any prefix/name format.
 */
export function createAsyncIconifyResolver(): AsyncIconResolver {
	return async (name: string): Promise<string | null> => {
		if (!name.includes('/')) return null
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
 * For convenience, when you pass the built-in `iconifyResolver` sync resolver,
 * this function automatically pairs it with its async counterpart.
 * This way you can just write `[iconifyResolver]` instead of having to specify both variants manually.
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
	if (resolver === iconifyResolver) return createAsyncIconifyResolver()
	return null
}

/**
 * Returns a resolver that looks up the icon name in the given map (e.g. name -> SVG HTML).
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
	/** Resolvers tried in order; first non-null wins. Falls back to `:name:` if none match. */
	resolvers?: IconResolverInput[]
}

/**
 * Builds a function that turns icon content (name) into HTML using resolvers, then fallback.
 * Checks `env.frontmatterIcons` first (highest priority), then tries resolvers in order.
 *
 * @param options - Plugin options: resolvers.
 * @returns A function (content, env?) => HTML string.
 */
export function buildRender(
	options: MarkdownItIconOptions,
): (content: string, env?: IconEnv) => string {
	const resolvers = (options.resolvers ?? []).map(resolve =>
		typeof resolve === 'function' ? resolve : resolve.render,
	)

	return (content: string, env?: IconEnv) => {
		const name = content.trim()
		const fmHtml = env?.frontmatterIcons?.get(name)
		if (fmHtml != null) return fmHtml
		for (const resolve of resolvers) {
			const html = resolve(name)
			if (html != null) return html
		}
		return `:${escapeHtml(name)}:`
	}
}

/**
 * Returns the markdown-it render rule for `icon` tokens.
 * Passes the render env through so `buildRender` can read `env.frontmatterIcons`.
 *
 * @param render - Function that turns icon name (content) into HTML, optionally using env.
 * @returns A rule function compatible with `md.renderer.rules['icon']`.
 */
export function createIconRenderRule(
	render: (content: string, env?: IconEnv) => string,
): (
	tokens: { content?: string }[],
	idx: number,
	options?: unknown,
	env?: IconEnv,
) => string {
	return (tokens, idx, _options, env) => render(tokens[idx]?.content ?? '', env)
}
