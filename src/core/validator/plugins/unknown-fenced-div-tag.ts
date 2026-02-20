/**
 * Unknown Fenced Div Tag Plugin
 *
 * Validates that named fenced divs (`::: tagname`) use recognized HTML
 * block-level element names. Catches typos and misuse of inline element
 * names in a block-level context.
 *
 * ## Rule
 *
 * | Slug                      | Default severity | Description                         |
 * |---------------------------|------------------|-------------------------------------|
 * | `unknown-fenced-div-tag`  | warning          | Unrecognized tag in named fenced div |
 *
 * ## Frontmatter override
 *
 * ```yaml
 * check:
 *   unknown-fenced-div-tag: off       # disable this rule
 *   unknown-fenced-div-tag: note      # downgrade to note
 * ```
 *
 * ## Examples
 *
 * ```markdown
 * ::: banana          <- unknown-fenced-div-tag (warning)
 * Content
 * :::
 *
 * ::: nav             <- OK (known block-level tag)
 * Content
 * :::
 * ```
 *
 * @module validator/plugins/unknown-fenced-div-tag
 */

import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../types.js'
import { rangeFromToken } from '../utils.js'

const ALLOWED_TAGS = new Set([
	'address',
	'article',
	'aside',
	'blockquote',
	'details',
	'dialog',
	'dd',
	'div',
	'dl',
	'dt',
	'fieldset',
	'figcaption',
	'figure',
	'footer',
	'form',
	'header',
	'hr',
	'li',
	'main',
	'nav',
	'ol',
	'p',
	'pre',
	'section',
	'summary',
	'table',
	'ul',
])

export const unknownFencedDivTagPlugin: ValidatorPlugin = {
	name: 'unknown-fenced-div-tag',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { tokens, lines } = ctx
		const issues: ValidationIssue[] = []

		for (const token of tokens) {
			if (token.type !== 'fenced_div_open') continue

			const isNamed = (token.meta as { named?: boolean })?.named === true
			if (!isNamed) continue

			if (!ALLOWED_TAGS.has(token.tag)) {
				issues.push({
					severity: 'warning',
					code: 'unknown-fenced-div-tag',
					message: `Unknown tag name '${token.tag}' in fenced div. Known tags: ${[...ALLOWED_TAGS].join(', ')}`,
					range: rangeFromToken(token, lines),
				})
			}
		}

		return issues
	},
}
