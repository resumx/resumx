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
	type MarkdownItWithAsyncIcon,
	wikiCommonsResolver,
	githubResolver,
} from '../lib/mdit-plugins/icon/index.js'
import { bracketedSpans } from '../lib/mdit-plugins/bracketed-span/index.js'
import { fencedDiv } from '../lib/mdit-plugins/fenced-div/index.js'
import { timePlugin } from '../lib/mdit-plugins/time/index.js'
import { fixAttrsListSoftbreak } from '../lib/mdit-plugins/fix-attrs-list-softbreak/index.js'

/**
 * Create a configured markdown-it instance with all resume plugins
 *
 * Plugin order is critical:
 * - fencedDiv MUST come early to handle ::: {.class} blocks before other rules
 * - bracketedSpans MUST come BEFORE attrs for proper attribute application
 * - fixAttrsListSoftbreak MUST come AFTER attrs (registers a core rule before
 *   attrs' curly_attributes rule, which only exists after attrs is loaded)
 */
export function createMarkdownRenderer(): MarkdownItWithAsyncIcon {
	return new MarkdownIt({
		html: true,
		linkify: true,
		typographer: true,
	})
		.use(fencedDiv)
		.use(bracketedSpans)
		.use(icon, {
			resolvers: [wikiCommonsResolver, githubResolver, iconifyResolver],
		})
		.use(dl)
		.use(mark)
		.use(attrs)
		.use(fixAttrsListSoftbreak)
		.use(sub)
		.use(sup)
		.use(timePlugin) as MarkdownItWithAsyncIcon
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
