import { closest, distance } from 'fastest-levenshtein'
import type { FrontmatterConfig } from '../frontmatter.js'
import type { OutputFormat } from '../renderer.js'
import type { ViewLayer } from './types.js'
import { loadViewFile } from './load.js'

/**
 * Convert parsed frontmatter tags into a map of tag view layers.
 *
 * Every tag produces a view layer:
 * - Shorthand (`fullstack: [frontend, backend]`):
 *   ViewLayer with selects = [tagName, ...constituents]
 * - Expanded (`frontend: { extends: [backend], pages: 1 }`):
 *   ViewLayer with selects = [tagName, ...extends] plus view config fields
 */
export function extractTagViews(
	tags: FrontmatterConfig['tags'],
): Record<string, ViewLayer> {
	if (!tags) return {}
	const views: Record<string, ViewLayer> = {}

	for (const [name, entry] of Object.entries(tags)) {
		if (Array.isArray(entry)) {
			views[name] = { selects: [name, ...entry] }
			continue
		}

		const view: ViewLayer = {
			selects: [name, ...(entry.extends ?? [])],
		}
		if (entry.sections) view.sections = entry.sections
		if (entry.pages !== undefined) view.pages = entry.pages
		if (entry['bullet-order']) view.bulletOrder = entry['bullet-order']
		if (entry.vars) view.vars = entry.vars
		if (entry.style) view.style = entry.style as Record<string, string>
		if (entry.format) view.format = entry.format as OutputFormat
		if (entry.output) view.output = entry.output
		if (entry.css) view.css = entry.css
		views[name] = view
	}

	return views
}

export interface NamedViewLayer {
	name: string
	layer: ViewLayer
}

/**
 * Resolve a `--for` flag value to a view layer via exact name match.
 *
 * Resolution order:
 * 1. Exact match in tag views (from frontmatter)
 * 2. Exact match in custom views (from .view.yaml files)
 * 3. If name matches both tag and custom → ambiguity error
 * 4. Known content tag without explicit view → implicit view with selects: [name]
 * 5. Error with Levenshtein suggestion
 */
export function resolveForFlag(
	name: string,
	tagViews: Record<string, ViewLayer>,
	customViews: Record<string, ViewLayer>,
	contentTags: string[],
): ViewLayer {
	const inTag = name in tagViews
	const inCustom = name in customViews

	if (inTag && inCustom) {
		throw new Error(
			`Ambiguous view name '${name}': exists as both a tag view and a custom view. Rename one to resolve the conflict.`,
		)
	}

	if (inTag) return tagViews[name]!
	if (inCustom) return customViews[name]!

	if (
		contentTags.includes(name)
		|| contentTags.some(t => t.startsWith(name + '/'))
	)
		return { selects: [name] }

	const allKnown = [
		...new Set([
			...Object.keys(tagViews),
			...Object.keys(customViews),
			...contentTags,
		]),
	]

	if (allKnown.length === 0) {
		throw new Error(
			`Unknown view '${name}'. No tags or views found in content, frontmatter, or .view.yaml files.`,
		)
	}

	const best = closest(name, allKnown)
	if (distance(name, best) <= 2) {
		throw new Error(`Unknown view '${name}'. Did you mean '${best}'?`)
	}

	throw new Error(`Unknown view '${name}'. Available: ${allKnown.join(', ')}`)
}

function isGlobPattern(value: string): boolean {
	return value.includes('*') || value.includes('?')
}

function isViewFilePath(value: string): boolean {
	return value.endsWith('.view.yaml')
}

/**
 * Match a simple glob pattern against a string.
 * Supports `*` (any chars) and `?` (single char).
 */
function matchGlob(pattern: string, name: string): boolean {
	const escaped = pattern
		.replace(/[.+^${}()|[\]\\]/g, '\\$&')
		.replace(/\*/g, '.*')
		.replace(/\?/g, '.')
	return new RegExp(`^${escaped}$`).test(name)
}

/**
 * Process a single `--for` value. Handles three forms:
 *
 * 1. **File path** (`./stripe.view.yaml`) → load all views from file
 * 2. **Glob** (`stripe-*`, `*`) → match against all named views (tag + custom)
 * 3. **Exact name** → resolve via resolveForFlag
 */
export function resolveForValue(
	value: string,
	tagViews: Record<string, ViewLayer>,
	customViews: Record<string, ViewLayer>,
	contentTags: string[],
): NamedViewLayer[] {
	if (isViewFilePath(value)) {
		const views = loadViewFile(value)
		const entries = Object.entries(views)
		if (entries.length === 0) {
			throw new Error(`No views found in ${value}`)
		}
		return entries.map(([name, layer]) => ({ name, layer }))
	}

	if (isGlobPattern(value)) {
		const namedViews: Record<string, ViewLayer> = {
			...customViews,
			...tagViews,
		}

		const allNames = [...new Set([...Object.keys(namedViews), ...contentTags])]
		const matches = allNames.filter(n => matchGlob(value, n))

		if (matches.length === 0) {
			if (allNames.length === 0) {
				throw new Error(
					`No views match pattern '${value}'. No views found. Create a .view.yaml file or define tag views in frontmatter.`,
				)
			}
			throw new Error(
				`No views match pattern '${value}'. Available: ${allNames.join(', ')}`,
			)
		}

		return matches.map(name => ({
			name,
			layer: namedViews[name] ?? { selects: [name] },
		}))
	}

	const layer = resolveForFlag(value, tagViews, customViews, contentTags)
	return [{ name: value, layer }]
}

/**
 * Validate that every tag name in a composition exists as a content tag
 * or as another composed/defined tag.
 */
export function validateTagComposition(
	tagMap: Record<string, string[]>,
	contentTags: string[],
): void {
	const definedTags = new Set(Object.keys(tagMap))

	for (const [composedName, constituents] of Object.entries(tagMap)) {
		for (const constituent of constituents) {
			if (
				contentTags.includes(constituent)
				|| definedTags.has(constituent)
				|| contentTags.some(t => t.startsWith(constituent + '/'))
			)
				continue

			const allKnown = [...new Set([...contentTags, ...definedTags])]
			const best = closest(constituent, allKnown)
			if (distance(constituent, best) <= 2) {
				throw new Error(
					`Tag '${constituent}' in composition '${composedName}' does not exist. Did you mean '${best}'?`,
				)
			}
			throw new Error(
				`Tag '${constituent}' in composition '${composedName}' does not exist in the document or as a composed tag.`,
			)
		}
	}
}
