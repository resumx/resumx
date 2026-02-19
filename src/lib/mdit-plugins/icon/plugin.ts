/**
 * Markdown-it plugin: inline icons via :icon-name:
 */

import type MarkdownIt from 'markdown-it'
import type { PluginWithOptions } from 'markdown-it'

import {
	type IconResolver,
	type IconResolverInput,
	type IconResolverSpec,
	type IconEnv,
	type MarkdownItIconOptions,
	buildRender,
	createIconRenderRule,
	normalizeResolverInputs,
	processFrontmatterIcons,
} from './renderer.js'
import { iconParserRule } from './parser.js'
import type { AsyncIconResolver } from './prepare.js'
import { prepareIcons } from './prepare.js'
import { iconCache } from './utils.js'

export interface MarkdownItWithAsyncIcon extends MarkdownIt {
	renderAsync(src: string, env?: unknown): Promise<string>
	renderInlineAsync(src: string, env?: unknown): Promise<string>
}

export type {
	IconResolver,
	IconResolverInput,
	IconResolverSpec,
	MarkdownItIconOptions,
}
export { createCustomResolver } from './renderer.js'

/**
 * Markdown-it plugin that parses `:icon-name:` and renders icons via resolvers.
 *
 * @param md - Markdown-it instance.
 * @param options - Optional. Resolvers to try in order.
 * @returns The same markdown-it instance (chainable).
 */
export const icon: PluginWithOptions<MarkdownItIconOptions> = (
	md,
	options = {},
) => {
	const normalizedResolvers = normalizeResolverInputs(options.resolvers ?? [])
	const render = buildRender({ resolvers: normalizedResolvers })
	const prepareResolvers = normalizedResolvers
		.map(resolver => resolver.prepare)
		.filter((resolver): resolver is AsyncIconResolver => resolver != null)
	md.inline.ruler.before('link', 'icon', iconParserRule)
	md.renderer.rules['icon'] = createIconRenderRule(render)

	const mdWithAsync = md as MarkdownItWithAsyncIcon
	mdWithAsync.renderAsync = async (src: string, env?: unknown) => {
		const renderEnv = await prepareEnv(env)
		await prepareIconsIfNeeded(src, prepareResolvers)
		return md.render(src, renderEnv)
	}
	mdWithAsync.renderInlineAsync = async (src: string, env?: unknown) => {
		const renderEnv = await prepareEnv(env)
		await prepareIconsIfNeeded(src, prepareResolvers)
		return md.renderInline(src, renderEnv)
	}
}

/**
 * Process raw `env.iconOverrides` into `env.frontmatterIcons` so the render rule can read them.
 * Returns a new env object (never mutates the caller's).
 */
async function prepareEnv(env: unknown): Promise<IconEnv> {
	const typedEnv = (env ?? {}) as IconEnv
	if (
		!typedEnv.iconOverrides
		|| Object.keys(typedEnv.iconOverrides).length === 0
	) {
		return typedEnv
	}
	return {
		...typedEnv,
		frontmatterIcons: await processFrontmatterIcons(typedEnv.iconOverrides),
	}
}

async function prepareIconsIfNeeded(
	content: string,
	resolvers: AsyncIconResolver[],
): Promise<void> {
	if (resolvers.length === 0) return
	await prepareIcons(content, iconCache, resolvers)
}
