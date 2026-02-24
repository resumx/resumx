/**
 * HTML Generator Module
 * Converts markdown content to standalone HTML with embedded CSS
 */

import jsBeautify from 'js-beautify'
const { html: beautifyHtml } = jsBeautify
import { generateVariablesCSS } from '../lib/css-engine/css-variables.js'
import { getBundledStylesDir } from './styles.js'
import { resolveCssImports } from '../lib/css-engine/css-resolver.js'
import { compileTailwindCSS } from '../lib/css-engine/tailwind.js'
import { markdownRenderer } from './markdown.js'
import { runPipeline } from './dom-processors/index.js'
import type { PipelineContext } from './dom-processors/index.js'

/**
 * Options for HTML generation
 */
export interface HtmlGeneratorOptions {
	/** Absolute paths to CSS files (combined in order) */
	cssPaths: string[]
	/** Optional CSS variable overrides */
	variables?: Record<string, string>
	/** Active role for filtering content (if set, only matching role content is included) */
	activeRole?: string
	/** Active language for filtering content (if set, only matching language content is included) */
	activeLang?: string
	/** Role composition map from frontmatter (composed role name -> constituent roles) */
	roleMap?: Record<string, string[]>
	/** Custom icon overrides from frontmatter (slug -> SVG/URL/base64) */
	icons?: Record<string, string>
}

/**
 * Resolve CSS and combine with variable overrides
 */
function resolveBaseCSS(
	cssPaths: string[],
	variables?: Record<string, string>,
): string {
	const resolvedCSS = cssPaths
		.map(p => resolveCssImports(p, getBundledStylesDir()))
		.join('\n')
	const variablesCSS = variables ? generateVariablesCSS(variables) : ''

	return resolvedCSS + '\n' + variablesCSS
}

/**
 * Assemble final HTML document with formatted output
 */
function assembleHtml(body: string, css: string): string {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${css}
</style>
</head>
<body>
${body}
</body>
</html>`

	// Format with js-beautify for readable output
	return beautifyHtml(html, {
		indent_with_tabs: true,
		indent_size: 1,
		max_preserve_newlines: 1,
		preserve_newlines: true,
		wrap_line_length: 0, // Don't wrap lines
		unformatted: ['code', 'pre', 'script', 'style'], // Don't format inside these
		content_unformatted: ['pre', 'code'], // Preserve content whitespace
		extra_liners: ['head', 'body', '/html'], // Add extra newline before these
	})
}

/**
 * Convert markdown to standalone HTML with embedded CSS
 * Includes Tailwind CSS compilation for utility classes used in the content
 */
export async function generateHtml(
	content: string,
	options: HtmlGeneratorOptions,
): Promise<string> {
	const env: { iconOverrides?: Record<string, string> } = {
		iconOverrides: options.icons,
	}
	const rawBody = await markdownRenderer.renderAsync(content, env)

	const baseCSS = resolveBaseCSS(options.cssPaths, options.variables)

	// Build pipeline context
	const ctx: PipelineContext = {
		config: {
			activeRole: options.activeRole,
			activeLang: options.activeLang,
			variables: options.variables,
			roleMap: options.roleMap,
		},
		env: {
			css: baseCSS,
		},
	}

	// Run DOM processor pipeline (role filtering, header extraction, columns, section wrapping)
	const body = runPipeline(rawBody, ctx)

	// Compile Tailwind CSS for classes used in the HTML body
	const tailwindCSS = await compileTailwindCSS(body)

	// Tailwind first (declares layer order), then base styles (@layer base merges in,
	// @layer utilities from Tailwind properly overrides base styles)
	const combinedCSS = tailwindCSS + '\n' + baseCSS

	return assembleHtml(body, combinedCSS)
}
