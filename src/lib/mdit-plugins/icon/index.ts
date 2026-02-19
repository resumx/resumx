/**
 * Icon plugin and render helpers. Use `icon` as a markdown-it plugin; export renderers for options.
 */
export {
	icon,
	createCustomResolver,
	type MarkdownItWithAsyncIcon,
	type MarkdownItIconOptions,
	type IconResolver,
	type IconResolverInput,
	type IconResolverSpec,
} from './plugin.js'

export { iconifyResolver, emojiResolver } from './renderer.js'
export { createAssetsResolver } from './renderer.js'
export { type IconEnv } from './renderer.js'
