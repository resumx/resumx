/**
 * Parser rule for ::icon-name:: syntax.
 * Sees ::xxx::, pushes { type: 'icon', content: 'xxx' }, advances state.pos.
 */

import type { RuleInline } from 'markdown-it/lib/parser_inline.mjs'

const CHAR_COLON = 0x3a // :
const CHAR_SPACE = 0x20 // " "
const MIN_ICON_LEN = 5 // "::x::"

/**
 * Inline rule that matches `::name::` and pushes an icon token.
 *
 * @param state - Inline parser state (src, pos, tokens).
 * @param silent - If true, do not create tokens (validation/skip mode).
 * @returns True if `::...::` was matched and an icon token was pushed (or would be in silent mode).
 */
export const iconParserRule: RuleInline = (state, silent) => {
	let found = false
	const max = state.posMax
	const start = state.pos

	// ::xxx
	if (
		state.src.charCodeAt(start) !== CHAR_COLON
		|| state.src.charCodeAt(start + 1) !== CHAR_COLON
	) {
		return false
	}

	const next = state.src.charCodeAt(start + 2)
	if (next === CHAR_SPACE || next === CHAR_COLON) return false
	if (silent) return false
	if (max - start < MIN_ICON_LEN) return false

	state.pos = start + 2

	while (state.pos < max) {
		if (
			state.src.charCodeAt(state.pos) === CHAR_COLON
			&& state.src.charCodeAt(state.pos + 1) === CHAR_COLON
		) {
			found = true
			break
		}
		state.md.inline.skipToken(state)
	}

	if (
		!found
		|| start + 2 === state.pos
		|| state.src.charCodeAt(state.pos - 1) === CHAR_SPACE
	) {
		state.pos = start
		return false
	}

	// Reserve :::...::: for future use: do not consume inner ::...:: as icon
	const endPair = state.pos
	const tripleAfter =
		endPair + 2 <= max && state.src.charCodeAt(endPair + 2) === CHAR_COLON
	const tripleBefore =
		start >= 1 && state.src.charCodeAt(start - 1) === CHAR_COLON
	if (tripleAfter && tripleBefore) {
		state.pos = start
		return false
	}

	const info = state.src.slice(start + 2, state.pos)

	state.posMax = state.pos
	state.pos = start + 2

	const icon = state.push('icon', 'i', 0)
	icon.markup = '::'
	icon.content = info

	state.pos = state.posMax + 2
	state.posMax = max

	return true
}
