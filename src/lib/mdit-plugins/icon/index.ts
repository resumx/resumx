/**
 * Icon plugin and render helpers. Use `icon` as a markdown-it plugin; export renderers for options.
 */
export {
	icon,
	createCustomResolver,
	type MarkdownItIconOptions,
	type IconResolver,
} from './plugin.js'

export { resumxIconResolver } from './renderer.js'
export { iconifyResolver } from './renderer.js'
export { wikiCommonsResolver } from './renderer.js'
export { githubResolver } from './renderer.js'
