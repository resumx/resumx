/**
 * Markdown Renderer Module
 * Configures markdown-it with plugins for resume rendering
 */

import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import { dl } from '@mdit/plugin-dl'
import { mark } from '@mdit/plugin-mark'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'
import {
	icon,
	iconifyResolver,
	resumxIconResolver,
	wikiCommonsResolver,
	githubResolver,
} from './mdit-plugins/icon/index.js'
import { bracketedSpans } from './mdit-plugins/bracketed-span/index.js'

/**
 * Create a configured markdown-it instance with all resume plugins
 *
 * Plugin order is critical:
 * - bracketedSpans MUST come BEFORE attrs for proper attribute application
 */
export function createMarkdownRenderer(): MarkdownIt {
	return new MarkdownIt({
		html: true,
		linkify: true,
		typographer: true,
	})
		.use(bracketedSpans)
		.use(icon, {
			resolvers: [
				resumxIconResolver,
				wikiCommonsResolver,
				githubResolver,
				iconifyResolver,
			],
		})
		.use(dl)
		.use(mark)
		.use(attrs)
		.use(sub)
		.use(sup)
}

/**
 * Default markdown renderer instance
 * Reused across renders for efficiency
 */
export const markdownRenderer = createMarkdownRenderer()

/**
 * Render markdown content to HTML
 */
export function renderMarkdown(content: string): string {
	return markdownRenderer.render(content)
}
