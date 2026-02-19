/**
 * Parser rule for :icon-name: syntax (emoji-style).
 * Supports optional namespace via slash for Iconify format: :prefix/name:
 *
 * Colons are always delimiters. Slash separates prefix from name (at most one).
 */

import type { RuleInline } from 'markdown-it/lib/parser_inline.mjs'

const CHAR_COLON = 0x3a // :
const CHAR_SLASH = 0x2f // /
const MIN_ICON_LEN = 3 // ":x:"

function isNameChar(code: number): boolean {
	return (
		(code >= 0x61 && code <= 0x7a) // a-z
		|| (code >= 0x41 && code <= 0x5a) // A-Z
		|| (code >= 0x30 && code <= 0x39) // 0-9
		|| code === 0x2d // -
		|| code === 0x5f // _
	)
}

/**
 * Inline rule that matches `:name:` or `:prefix/name:` and pushes an icon token.
 *
 * Scanning strategy:
 * 1. Match opening `:`
 * 2. Scan valid name characters [a-zA-Z0-9_-]
 * 3. On `/`: treat as namespace separator (at most one), next char must be a valid name start
 * 4. On `:`: closing delimiter
 * 5. Push icon token with captured content
 */
export const iconParserRule: RuleInline = (state, silent) => {
	const max = state.posMax
	const start = state.pos

	if (state.src.charCodeAt(start) !== CHAR_COLON) return false
	if (max - start < MIN_ICON_LEN) return false

	const afterOpen = state.src.charCodeAt(start + 1)
	if (afterOpen === undefined || !isNameChar(afterOpen)) return false
	if (silent) return false

	let pos = start + 1
	let hasNamespace = false

	while (pos <= max) {
		const code = state.src.charCodeAt(pos)

		if (code === CHAR_COLON) {
			if (pos === start + 1) return false // empty name

			const content = state.src.slice(start + 1, pos)

			const icon = state.push('icon', 'i', 0)
			icon.markup = ':'
			icon.content = content

			state.pos = pos + 1
			return true
		}

		if (code === CHAR_SLASH) {
			if (hasNamespace) break // only one slash allowed
			if (pos === start + 1) break // slash at start of name
			const nextCode = state.src.charCodeAt(pos + 1)
			if (!isNameChar(nextCode)) break // slash must be followed by valid name char
			hasNamespace = true
			pos++
			continue
		}

		if (!isNameChar(code)) break

		pos++
	}

	return false
}
