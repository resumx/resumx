/**
 * HTML Generator Module
 * Converts markdown content to standalone HTML with embedded CSS
 */

import { existsSync } from 'node:fs'
import { resolve, isAbsolute } from 'node:path'
import jsBeautify from 'js-beautify'
const { html: beautifyHtml } = jsBeautify
import { generateVariablesCSS } from '../lib/css-engine/css-variables.js'
import { getBundledStylesDir, DEFAULT_STYLESHEET } from './styles.js'
import { resolveCssImports } from '../lib/css-engine/css-resolver.js'
import { compileTailwindCSS } from '../lib/css-engine/tailwind.js'
import { markdownRenderer } from './markdown.js'
import { assemblePipeline } from './dom-processors/index.js'
import type { VarsEnv } from '../lib/mdit-plugins/variable-substitution/index.js'
import type { ResolvedView } from './view/types.js'
import type { DocumentContext } from './types.js'

const PREPROCESSOR_EXTS = ['.less', '.sass', '.scss', '.styl']

export interface ResolvedCSS {
	paths: string[]
	inline: string[]
}

/**
 * Classify CSS entries into file paths and inline CSS strings.
 * Entries ending with `.css` are resolved as file paths.
 * Everything else is treated as inline CSS.
 * Known preprocessor extensions produce a clear error.
 */
export function resolveCSS(css: string[] | null, baseDir: string): ResolvedCSS {
	if (!css || css.length === 0)
		return { paths: [DEFAULT_STYLESHEET], inline: [] }

	const paths = [DEFAULT_STYLESHEET]
	const inline: string[] = []

	for (const entry of css) {
		const trimmed = entry.trimEnd()
		const lower = trimmed.toLowerCase()
		const ext = PREPROCESSOR_EXTS.find(e => lower.endsWith(e))
		if (ext) {
			throw new Error(
				`CSS preprocessor files (${ext}) are not supported. Use plain CSS instead.`,
			)
		}

		if (lower.endsWith('.css')) {
			const absolutePath =
				isAbsolute(trimmed) ? trimmed : resolve(baseDir, trimmed)
			if (!existsSync(absolutePath)) {
				throw new Error(`CSS file not found: ${absolutePath}`)
			}
			paths.push(absolutePath)
		} else {
			inline.push(entry)
		}
	}

	return { paths, inline }
}

function resolveBaseCSS(
	cssPaths: string[],
	variables: Record<string, string>,
): string {
	const resolvedCSS = cssPaths
		.map(p => resolveCssImports(p, getBundledStylesDir()))
		.join('\n')
	const variablesCSS =
		Object.keys(variables).length > 0 ? generateVariablesCSS(variables) : ''

	return resolvedCSS + '\n' + variablesCSS
}

function assembleHtml(
	body: string,
	css: string,
	inlineBlocks: string[],
): string {
	const inlineStyles = inlineBlocks
		.map(block => `\n<style>\n${block}\n</style>`)
		.join('')

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${css}
</style>${inlineStyles}
</head>
<body>
${body}
</body>
</html>`

	return beautifyHtml(html, {
		indent_with_tabs: true,
		indent_size: 1,
		max_preserve_newlines: 1,
		preserve_newlines: true,
		wrap_line_length: 0,
		unformatted: ['code', 'pre', 'script', 'style'],
		content_unformatted: ['pre', 'code'],
		extra_liners: ['head', 'body', '/html'],
	})
}

/**
 * Convert markdown to standalone HTML with embedded CSS.
 * Resolves CSS paths internally from view.css + doc.baseDir.
 */
export async function generateHtml(
	doc: DocumentContext,
	view: ResolvedView,
): Promise<string> {
	const resolved = resolveCSS(view.css, doc.baseDir)
	const env: { iconOverrides?: Record<string, string> } & VarsEnv = {
		iconOverrides: doc.icons,
		vars: view.vars,
	}
	const rawBody = await markdownRenderer.renderAsync(doc.content, env)

	const baseCSS = resolveBaseCSS(resolved.paths, view.style)
	const pipeline = assemblePipeline(view, doc)
	const body = pipeline(rawBody)

	const tailwindCSS = await compileTailwindCSS(body)
	const combinedCSS = tailwindCSS + '\n' + baseCSS

	return assembleHtml(body, combinedCSS, resolved.inline)
}
