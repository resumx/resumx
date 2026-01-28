/**
 * markdown-it plugin for bracketed spans
 * Based on https://github.com/mb21/markdown-it-bracketed-spans
 *
 * Converts [text]{.class} to <span class="class">text</span>
 * Works with markdown-it-attrs for attribute parsing
 */

import type MarkdownIt from 'markdown-it'

export function bracketedSpans(md: MarkdownIt): void {
	function span(state: any, silent: boolean): boolean {
		const max = state.posMax

		// Check if current char is opening '['
		if (state.src.charCodeAt(state.pos) !== 0x5b /* [ */) {
			return false
		}

		const labelStart = state.pos + 1
		const labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true)

		// Parser failed to find closing ']'
		if (labelEnd < 0) {
			return false
		}

		let pos = labelEnd + 1

		// Check if there's a '{' immediately after ']'
		if (pos < max && state.src.charCodeAt(pos) === 0x7b /* { */) {
			// Found span pattern: [text]{...}

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
			}

			return true
		}

		return false
	}

	md.inline.ruler.push('bracketed-spans', span)
}
