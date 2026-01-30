/**
 * Markdown-it plugin: inline icons via ::icon-name::
 */

import type { PluginWithOptions } from 'markdown-it'

import {
	type IconResolver,
	type MarkdownItIconOptions,
	buildRender,
	createIconRenderRule,
} from './renderer.js'
import { iconParserRule } from './parser.js'

export type { IconResolver, MarkdownItIconOptions }
export { iconifyRender, createCustomResolver } from './renderer.js'

/**
 * Markdown-it plugin that parses `::icon-name::` and renders icons via resolvers.
 *
 * @param md - Markdown-it instance.
 * @param options - Optional. Resolvers to try in order.
 * @returns The same markdown-it instance (chainable).
 */
export const icon: PluginWithOptions<MarkdownItIconOptions> = (
	md,
	options = {},
) => {
	const render = buildRender(options)

	md.inline.ruler.before('link', 'icon', iconParserRule)
	md.renderer.rules['icon'] = createIconRenderRule(render)
}
