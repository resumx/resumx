/**
 * HTML Generator Module
 * Converts markdown content to standalone HTML with embedded CSS
 */

import { parseHTML } from 'linkedom'
import { generateVariablesCSS } from './styles.js'
import { resolveCssImports } from './css-resolver.js'
import { compileTailwindCSS } from './tailwind.js'
import { processExpressions } from './interpolation.js'
import { renderMarkdown } from './markdown.js'

/**
 * Get siblings of an element up to (but not including) a target element
 */
function getSiblingsBefore(parent: Element, target: Element | null): Element[] {
	const siblings: Element[] = []
	let current = parent.firstElementChild

	while (current && current !== target) {
		siblings.push(current)
		current = current.nextElementSibling
	}

	return siblings
}

/**
 * Get siblings of an element starting from (but not including) a target element
 */
function getSiblingsAfter(target: Element | null): Element[] {
	if (!target) return []

	const siblings: Element[] = []
	let current = target.nextElementSibling

	while (current) {
		siblings.push(current)
		current = current.nextElementSibling
	}

	return siblings
}

/**
 * Serialize an array of elements to HTML string
 */
function serializeElements(elements: Element[]): string {
	return elements.map(el => el.outerHTML).join('')
}

/**
 * Process HTML for header extraction and two-column layout using DOM parsing
 * - Always extracts content before first <h2> into <header> element
 * - No <hr>: return <header> + rest (single column)
 * - <hr> + no support: return <header> + concatenated content (single column)
 * - <hr> + support: return two-column layout with header inside
 */
export function processColumns(html: string, css: string): string {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!

	const firstHr = root.querySelector('hr')
	const firstH2 = root.querySelector('h2')

	// No hr: single-column mode with optional header
	if (!firstHr) {
		if (!firstH2 || firstH2 === root.firstElementChild) {
			// No h2 or h2 is first: return unchanged
			return html
		}
		// Extract header (content before first h2)
		const headerContent = getSiblingsBefore(root, firstH2)
		const restContent = [firstH2, ...getSiblingsAfter(firstH2)]

		return `<header>${serializeElements(headerContent)}</header>\n${serializeElements(restContent)}`
	}

	// Has hr: collect content before/after hr, remove all hr elements
	const beforeHr = getSiblingsBefore(root, firstHr)
	const afterHr = getSiblingsAfter(firstHr).filter(el => el.tagName !== 'HR')

	// Check if style supports two-column layout
	const supportsTwoColumn = /\.two-column-layout\s*\{/.test(css)

	if (!supportsTwoColumn) {
		// No two-column support: concatenate and extract header
		const allContent = [...beforeHr, ...afterHr]
		const h2InAll = allContent.find(el => el.tagName === 'H2')

		if (!h2InAll || h2InAll === allContent[0]) {
			return serializeElements(allContent)
		}

		const h2Index = allContent.indexOf(h2InAll)
		const headerContent = allContent.slice(0, h2Index)
		const restContent = allContent.slice(h2Index)

		return `<header>${serializeElements(headerContent)}</header>\n${serializeElements(restContent)}`
	}

	// Two-column mode: extract header from beforeHr, rest goes to primary
	const h2InBefore = beforeHr.find(el => el.tagName === 'H2')
	let header = ''
	let primary: Element[]

	if (h2InBefore && h2InBefore !== beforeHr[0]) {
		const h2Index = beforeHr.indexOf(h2InBefore)
		header = `<header>${serializeElements(beforeHr.slice(0, h2Index))}</header>\n`
		primary = beforeHr.slice(h2Index)
	} else {
		primary = beforeHr
	}

	return `<div class="two-column-layout">
${header}<div class="primary">${serializeElements(primary)}</div>
<div class="secondary">${serializeElements(afterHr)}</div>
</div>`
}

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
	const rawBody = renderMarkdown(processedContent)

	// Resolve base CSS with variable overrides
	const baseCSS = resolveBaseCSS(options.cssPath, options.variables)

	// Process two-column layout (strips <hr>, wraps if style supports it)
	const body = processColumns(rawBody, baseCSS)

	// Compile Tailwind CSS for classes used in the HTML body
	const tailwindCSS = await compileTailwindCSS(body)

	// Combine CSS: Tailwind first (resets/utilities), then base styles (can override)
	const combinedCSS = tailwindCSS + '\n' + baseCSS

	// Assemble final HTML
	return assembleHtml(body, combinedCSS)
}
