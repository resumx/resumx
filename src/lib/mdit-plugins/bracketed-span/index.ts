/**
 * markdown-it plugin for bracketed spans
 * Based on https://github.com/mb21/markdown-it-bracketed-spans
 *
 * Converts [text]{.class} to <span class="class">text</span>
 * Works with markdown-it-attrs for attribute parsing
 */

import type MarkdownIt from 'markdown-it'

export function bracketedSpans(md: MarkdownIt): void {
	/**
	 * Find matching closing bracket, skipping over nested bracketed spans
	 */
	function findMatchingBracket(
		src: string,
		start: number,
		max: number,
	): number {
		let pos = start + 1 // Skip opening '['
		let level = 1

		while (pos < max && level > 0) {
			const char = src.charCodeAt(pos)

			if (char === 0x5c /* \ */) {
				// Skip escaped characters
				pos += 2
				continue
			}

			if (char === 0x5b /* [ */) {
				level++
			} else if (char === 0x5d /* ] */) {
				level--
				if (level === 0) {
					return pos
				}
			}

			pos++
		}

		return -1
	}

	function span(state: any, silent: boolean): boolean {
		const max = state.posMax
		const start = state.pos

		// Check if current char is opening '['
		if (state.src.charCodeAt(state.pos) !== 0x5b /* [ */) {
			return false
		}

		const labelStart = state.pos + 1
		const labelEnd = findMatchingBracket(state.src, state.pos, max)

		// Failed to find closing ']'
		if (labelEnd < 0) {
			return false
		}

		let pos = labelEnd + 1

		// Check if there's a '{' immediately after ']'
		if (pos < max && state.src.charCodeAt(pos) === 0x7b /* { */) {
			// Found potential span pattern: [text]{...}
			// Check if {} contains any attributes (not just empty or whitespace)
			let braceEnd = pos + 1
			let hasContent = false

			// Find the closing '}' and check if there's any non-whitespace content
			while (braceEnd < max) {
				const char = state.src.charCodeAt(braceEnd)
				if (char === 0x7d /* } */) {
					break
				}
				// Check if there's any non-whitespace content
				if (char !== 0x20 && char !== 0x09 && char !== 0x0a && char !== 0x0d) {
					hasContent = true
				}
				braceEnd++
			}

			// Only create span if there are actual attributes
			if (!hasContent) {
				return false
			}

			if (!silent) {
				// Save current position
				const oldPos = state.pos
				const oldPosMax = state.posMax

				// Set bounds to parse content between [ ]
				state.pos = labelStart
				state.posMax = labelEnd

				// Create span tokens
				state.push('span_open', 'span', 1)

				// Recursively parse the content
				state.md.inline.tokenize(state)

				state.push('span_close', 'span', -1)

				// Restore position, leaving state.pos at '{' for markdown-it-attrs
				state.pos = pos
				state.posMax = oldPosMax
			} else {
				// In silent mode, still need to advance position
				state.pos = pos
			}

			return true
		}

		return false
	}

	md.inline.ruler.before('link', 'bracketed-spans', span)
}
