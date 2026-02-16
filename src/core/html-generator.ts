/**
 * HTML Generator Module
 * Converts markdown content to standalone HTML with embedded CSS
 */

import jsBeautify from 'js-beautify'
const { html: beautifyHtml } = jsBeautify
import { generateVariablesCSS } from '../lib/css-engine/css-variables.js'
import { getBundledThemesDir } from './themes.js'
import { resolveCssImports } from '../lib/css-engine/css-resolver.js'
import { compileTailwindCSS } from '../lib/css-engine/tailwind.js'
import { markdownRenderer } from './markdown.js'
import { runPipeline } from './dom-processors/index.js'
import type { PipelineContext } from './dom-processors/index.js'

/**
 * Options for HTML generation
 */
export interface HtmlGeneratorOptions {
	/** Absolute path to the CSS file */
	cssPath: string
	/** Optional CSS variable overrides */
	variables?: Record<string, string>
	/** Active role for filtering content (if set, only matching role content is included) */
	activeRole?: string
	/** Active language for filtering content (if set, only matching language content is included) */
	activeLang?: string
}

/**
 * Resolve CSS and combine with variable overrides
 */
function resolveBaseCSS(
	cssPath: string,
	variables?: Record<string, string>,
): string {
	// Resolve @import statements (with bundled themes dir as fallback for local theme files)
	const resolvedCSS = resolveCssImports(cssPath, getBundledThemesDir())
	const variablesCSS = variables ? generateVariablesCSS(variables) : ''

	// Append variable overrides AFTER resolved CSS so they take precedence
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
	// Render markdown to HTML body (icons are prepared inside icon plugin async path)
	const rawBody = await markdownRenderer.renderAsync(content)

	// Resolve base CSS with variable overrides
	const baseCSS = resolveBaseCSS(options.cssPath, options.variables)

	// Build pipeline context
	const ctx: PipelineContext = {
		config: {
			activeRole: options.activeRole,
			activeLang: options.activeLang,
			variables: options.variables,
		},
		env: {
			css: baseCSS,
		},
	}

	// Run DOM processor pipeline (role filtering, header extraction, columns, section wrapping)
	const body = runPipeline(rawBody, ctx)

	// Compile Tailwind CSS for classes used in the HTML body
	const tailwindCSS = await compileTailwindCSS(body)

	// Combine CSS: Tailwind first (resets/utilities), then base styles (can override)
	const combinedCSS = tailwindCSS + '\n' + baseCSS

	// Assemble final HTML
	return assembleHtml(body, combinedCSS)
}
