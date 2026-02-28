import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import type StateCore from 'markdown-it/lib/rules_core/state_core.mjs'
import { closest, distance } from 'fastest-levenshtein'

const VAR_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*\}\}/g
const MAX_TYPO_DISTANCE = 2
const EXPANDING = Symbol('variable-substitution-expanding')

export interface VarsEnv {
	vars?: Record<string, string>
	[EXPANDING]?: boolean
}

/**
 * markdown-it plugin for {{ variable }} substitution.
 *
 * Operates as a core rule after inline parsing, so placeholders inside
 * code spans, fenced code blocks, and HTML comments are never touched.
 * Variable values are parsed as inline markdown, so bold/italic/links work.
 */
export function variableSubstitution(md: MarkdownIt): void {
	md.core.ruler.after('inline', 'variable_substitution', state => {
		const env = state.env as VarsEnv | undefined
		if ((env as Record<symbol, boolean> | undefined)?.[EXPANDING]) return

		const vars = env?.vars ?? {}
		const usedKeys = new Set<string>()
		const tokens = state.tokens

		const allPlaceholders = collectPlaceholderNames(tokens)

		for (let i = tokens.length - 1; i >= 0; i--) {
			const token = tokens[i]!
			if (token.type !== 'inline' || !token.children) continue

			const newChildren = expandInlineChildren(
				md,
				state,
				token.children,
				vars,
				usedKeys,
			)

			if (newChildren !== token.children) {
				token.children = newChildren
				token.content = newChildren.map(t => t.content).join('')
			}
		}

		checkForUnusedVars(vars, usedKeys, allPlaceholders)

		removeEmptyParagraphs(tokens)
	})
}

function expandInlineChildren(
	md: MarkdownIt,
	state: StateCore,
	children: Token[],
	vars: Record<string, string>,
	usedKeys: Set<string>,
): Token[] {
	let changed = false
	const result: Token[] = []

	for (const child of children) {
		if (child.type !== 'text' || !VAR_RE.test(child.content)) {
			result.push(child)
			continue
		}

		changed = true
		VAR_RE.lastIndex = 0

		let lastIndex = 0
		let match: RegExpExecArray | null

		while ((match = VAR_RE.exec(child.content)) !== null) {
			const name = match[1]!
			usedKeys.add(name)
			const value = vars[name]

			if (match.index > lastIndex) {
				const t = new state.Token('text', '', 0)
				t.content = child.content.slice(lastIndex, match.index)
				result.push(t)
			}

			if (value !== undefined && value !== '') {
				const subEnv = { ...state.env, [EXPANDING]: true }
				const parsed = md.parseInline(value, subEnv)
				if (parsed[0]?.children) {
					result.push(...parsed[0].children)
				}
			}

			lastIndex = match.index + match[0].length
		}

		if (lastIndex < child.content.length) {
			const t = new state.Token('text', '', 0)
			t.content = child.content.slice(lastIndex)
			result.push(t)
		}
	}

	return changed ? result : children
}

/**
 * Remove paragraph_open/inline/paragraph_close triplets where the inline
 * token has no meaningful content after substitution.
 * Handles the "standalone undefined variable removes its line" behavior.
 */
function removeEmptyParagraphs(tokens: Token[]): void {
	for (let i = tokens.length - 1; i >= 2; i--) {
		if (
			tokens[i]!.type === 'paragraph_close'
			&& tokens[i - 1]!.type === 'inline'
			&& tokens[i - 2]!.type === 'paragraph_open'
		) {
			const inline = tokens[i - 1]!
			const isEmpty =
				!inline.children
				|| inline.children.length === 0
				|| inline.children.every(
					c => c.type === 'text' && c.content.trim() === '',
				)

			if (isEmpty) {
				tokens.splice(i - 2, 3)
				i -= 2
			}
		}
	}
}

function checkForUnusedVars(
	vars: Record<string, string>,
	usedKeys: Set<string>,
	allPlaceholders: string[],
): void {
	const unusedKeys = Object.keys(vars).filter(k => !usedKeys.has(k))
	if (unusedKeys.length === 0) return

	for (const key of unusedKeys) {
		if (allPlaceholders.length > 0) {
			const match = closest(key, allPlaceholders)
			if (distance(key, match) <= MAX_TYPO_DISTANCE) {
				throw new Error(
					`Variable '${key}' is defined but never used in the document. Did you mean '${match}'?`,
				)
			}
		}

		throw new Error(
			`Variable '${key}' is defined but never used in the document`,
		)
	}
}

/**
 * Collect placeholder names from text tokens that survived parsing.
 * Only text tokens outside code blocks/spans appear here, which is
 * exactly the set we should check against for typo suggestions.
 */
function collectPlaceholderNames(tokens: Token[]): string[] {
	const names = new Set<string>()
	for (const token of tokens) {
		if (token.type !== 'inline' || !token.children) continue
		for (const child of token.children) {
			if (child.type !== 'text') continue
			for (const m of child.content.matchAll(VAR_RE)) {
				names.add(m[1]!)
			}
		}
	}
	return [...names]
}
