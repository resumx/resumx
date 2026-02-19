/**
 * Markdown Renderer Module
 * Configures markdown-it with plugins for resume rendering
 */

import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import { dl } from '@mdit/plugin-dl'
import { mark } from '@mdit/plugin-mark'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'
import {
	icon,
	iconifyResolver,
	emojiResolver,
	createAssetsResolver,
	type MarkdownItWithAsyncIcon,
} from '../lib/mdit-plugins/icon/index.js'
import { bracketedSpans } from '../lib/mdit-plugins/bracketed-span/index.js'
import { fencedDiv } from '../lib/mdit-plugins/fenced-div/index.js'
import { timePlugin } from '../lib/mdit-plugins/time/index.js'
import { fixAttrsListSoftbreak } from '../lib/mdit-plugins/fix-attrs-list-softbreak/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Bundled icons directory (relative to compiled dist) */
const BUNDLED_ICONS_DIR = resolve(__dirname, '../../assets/icons')

/**
 * Create a configured markdown-it instance with all resume plugins
 *
 * @param iconsDir - Directory containing SVG icon assets. Defaults to the bundled icons.
 *
 * Plugin order is critical:
 * - fencedDiv MUST come early to handle ::: {.class} blocks before other rules
 * - bracketedSpans MUST come BEFORE attrs for proper attribute application
 * - fixAttrsListSoftbreak MUST come AFTER attrs (registers a core rule before
 *   attrs' curly_attributes rule, which only exists after attrs is loaded)
 */
export function createMarkdownRenderer(
	iconsDir: string = BUNDLED_ICONS_DIR,
): MarkdownItWithAsyncIcon {
	return new MarkdownIt({
		html: true,
		linkify: true,
		typographer: true,
	})
		.use(fencedDiv)
		.use(bracketedSpans)
		.use(icon, {
			resolvers: [
				createAssetsResolver(iconsDir),
				iconifyResolver,
				emojiResolver,
			],
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
