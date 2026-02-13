/**
 * Fix for markdown-it-attrs "list softbreak" pattern
 *
 * markdown-it-attrs has a "list softbreak" pattern that applies {attrs} after
 * a softbreak in a list item to the <ul>/<ol> instead of the <li>. This is
 * by design in markdown-it-attrs, but violates standard markdown scoping:
 * continuation lines belong to the list item, so {attrs} should apply to <li>.
 *
 * This core rule runs before markdown-it-attrs' curly_attributes rule and
 * removes the trailing softbreak before attrs-only text in list item inlines.
 * This prevents the "list softbreak" pattern from matching, allowing the
 * correct "list item end" pattern to fire instead.
 *
 * @see https://github.com/arve0/markdown-it-attrs/blob/master/patterns.js
 */

import type MarkdownIt from 'markdown-it'

const ATTRS_ONLY_RE = /^\s*\{[^}]+\}\s*$/

export function fixAttrsListSoftbreak(md: MarkdownIt): void {
	md.core.ruler.before(
		'curly_attributes',
		'fix_attrs_list_softbreak',
		state => {
			const tokens = state.tokens

			for (let i = 0; i < tokens.length; i++) {
				const token = tokens[i]!
				if (token.type !== 'inline') continue
				if (i < 2 || tokens[i - 2]!.type !== 'list_item_open') continue

				const children = token.children
				if (!children || children.length < 3) continue

				const lastChild = children[children.length - 1]
				const secondLastChild = children[children.length - 2]
				if (!lastChild || !secondLastChild) continue

				if (
					secondLastChild.type === 'softbreak'
					&& lastChild.type === 'text'
					&& ATTRS_ONLY_RE.test(lastChild.content)
				) {
					children.splice(children.length - 2, 1)
				}
			}
		},
	)
}
