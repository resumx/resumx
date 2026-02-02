/**
 * HTML Generator Module
 * Converts markdown content to standalone HTML with embedded CSS
 */

import { generateVariablesCSS } from './styles.js'
import { resolveCssImports } from './css-resolver.js'
import { compileTailwindCSS } from './tailwind.js'
import { processExpressions } from './interpolation.js'
import { renderMarkdown } from './markdown.js'

/**
 * Options for HTML generation
 */
export interface HtmlGeneratorOptions {
	/** Absolute path to the CSS file */
	cssPath: string
	/** Optional CSS variable overrides */
	variables?: Record<string, string>
	/** Optional expression evaluation context */
	expressionContext?: Record<string, unknown>
}

/**
 * Resolve CSS and combine with variable overrides
 */
function resolveBaseCSS(
	cssPath: string,
	variables?: Record<string, string>,
): string {
	// Resolve @import statements
	const resolvedCSS = resolveCssImports(cssPath)
	const variablesCSS = variables ? generateVariablesCSS(variables) : ''

	// Append variable overrides AFTER resolved CSS so they take precedence
	return resolvedCSS + '\n' + variablesCSS
}

/**
 * Assemble final HTML document
 */
function assembleHtml(body: string, css: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://code.iconify.design/3/3.1.0/iconify.min.js"></script>
<style>
${css}
</style>
</head>
<body>
${body}
</body>
</html>`
}

/**
 * Convert markdown to standalone HTML with embedded CSS
 * Includes Tailwind CSS compilation for utility classes used in the content
 */
export async function generateHtml(
	content: string,
	options: HtmlGeneratorOptions,
): Promise<string> {
	// Process {{ }} expressions before markdown rendering
	const processedContent =
		options.expressionContext ?
			await processExpressions(content, options.expressionContext)
		:	content

	// Render markdown to HTML body
	const body = renderMarkdown(processedContent)

	// Compile Tailwind CSS for classes used in the HTML body
	const tailwindCSS = await compileTailwindCSS(body)

	// Resolve base CSS with variable overrides
	const baseCSS = resolveBaseCSS(options.cssPath, options.variables)

	// Combine CSS: Tailwind first (resets/utilities), then base styles (can override)
	const combinedCSS = tailwindCSS + '\n' + baseCSS

	// Assemble final HTML
	return assembleHtml(body, combinedCSS)
}
