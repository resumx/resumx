/**
 * markdown-it plugin for inline column separator
 *
 * Converts || into <span class="col"> elements placed directly in the parent.
 * CSS :has(> .col) targets the parent as the flex container, so {.class}
 * attrs on headings/paragraphs apply to the same element that does layout.
 *
 * Paired CSS:
 *
 *   :has(> .col) {
 *     display: flex;
 *     justify-content: space-between;
 *     align-items: baseline;
 *   }
 *
 * Implemented as a core rule (post-inline-parsing, pre-text_join) because
 * | is not in markdown-it's text terminator set. The rule does two passes:
 *   1. Split text tokens containing || into text + col_sep marker tokens
 *   2. Replace markers with html_inline open/close tags for .col spans
 *
 * Escaping: \| is handled by markdown-it's built-in escape rule, which
 * produces text_special tokens before this rule runs, so \|| naturally
 * produces literal || without special handling here.
 */

import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import type StateCore from 'markdown-it/lib/rules_core/state_core.mjs'

const COL_SEP_RE = /(?<!\|)\|\|(?!\|)/

export function columnSep(md: MarkdownIt): void {
	md.core.ruler.before('text_join', 'column_sep', columnSepCoreRule)
}

function columnSepCoreRule(state: StateCore): void {
	for (const blockToken of state.tokens) {
		if (blockToken.type !== 'inline' || !blockToken.children) continue

		const split = splitOnColSep(blockToken.children, state)
		if (!split) continue

		blockToken.children = wrapInColumns(split, state)
	}
}

/**
 * Pass 1: Split text tokens on || into text + col_sep markers.
 * Returns the new token array, or null if no || was found.
 */
function splitOnColSep(children: Token[], state: StateCore): Token[] | null {
	const result: Token[] = []
	let found = false

	for (const token of children) {
		if (token.type !== 'text' || !COL_SEP_RE.test(token.content)) {
			result.push(token)
			continue
		}

		found = true
		const parts = token.content.split(COL_SEP_RE)

		for (let i = 0; i < parts.length; i++) {
			if (i > 0) {
				result.push(new state.Token('col_sep', '', 0))
			}
			let part = parts[i] ?? ''
			if (i > 0) part = part.trimStart()
			if (i < parts.length - 1) part = part.trimEnd()
			if (part) {
				const text = new state.Token('text', '', 0)
				text.content = part
				result.push(text)
			}
		}
	}

	return found ? result : null
}

/**
 * Pass 2: Replace col_sep markers with html_inline open/close tags,
 * wrapping each segment in <span class="col">.
 */
function wrapInColumns(tokens: Token[], state: StateCore): Token[] {
	const out: Token[] = []

	out.push(htmlInline(state, '<span class="col">'))

	for (const token of tokens) {
		if (token.type === 'col_sep') {
			out.push(htmlInline(state, '</span>'))
			out.push(htmlInline(state, '<span class="col">'))
		} else {
			out.push(token)
		}
	}

	out.push(htmlInline(state, '</span>'))

	return out
}

function htmlInline(state: StateCore, content: string): Token {
	const token = new state.Token('html_inline', '', 0)
	token.content = content
	return token
}
