import { compile } from '@tailwindcss/node'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Extract class names from HTML string
 * Handles Tailwind arbitrary values with brackets and quotes like after:content-['↗']
 */
export function extractClassNames(html: string): string[] {
	const classes = new Set<string>()

	// Match class="..." (double quotes)
	const doubleQuoteRegex = /class\s*=\s*"([^"]*)"/gi
	let match
	while ((match = doubleQuoteRegex.exec(html)) !== null) {
		if (match[1]) {
			extractClassesFromValue(match[1], classes)
		}
	}

	// Match class='...' (single quotes)
	const singleQuoteRegex = /class\s*=\s*'([^']*)'/gi
	while ((match = singleQuoteRegex.exec(html)) !== null) {
		if (match[1]) {
			extractClassesFromValue(match[1], classes)
		}
	}

	return Array.from(classes)
}

/**
 * Extract individual class names from a class attribute value
 * Handles Tailwind classes with brackets like bg-[#123] or content-['text']
 */
function extractClassesFromValue(
	classValue: string,
	classes: Set<string>,
): void {
	const tokens: string[] = []
	let current = ''
	let bracketDepth = 0

	for (const char of classValue) {
		if (char === '[') {
			bracketDepth++
			current += char
		} else if (char === ']') {
			bracketDepth--
			current += char
		} else if (/\s/.test(char) && bracketDepth === 0) {
			if (current) {
				tokens.push(current)
				current = ''
			}
		} else {
			current += char
		}
	}
	if (current) {
		tokens.push(current)
	}

	for (const token of tokens) {
		if (token) {
			classes.add(token)
		}
	}
}

/**
 * Compile Tailwind CSS for the given HTML content
 * Uses Tailwind v4's programmatic API to generate only the CSS for used classes
 *
 * @param html - HTML string to scan for Tailwind classes
 * @returns Generated CSS string containing only used utilities
 */
export async function compileTailwindCSS(html: string): Promise<string> {
	const candidates = extractClassNames(html)

	if (candidates.length === 0) {
		return ''
	}

	const cssInput = `@import "tailwindcss" source(none);`

	try {
		const compiler = await compile(cssInput, {
			base: __dirname,
			onDependency: () => {},
		})

		const css = compiler.build(candidates)

		return css
	} catch (error) {
		console.error('Tailwind compilation error:', error)
		return ''
	}
}
