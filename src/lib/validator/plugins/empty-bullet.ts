/**
 * Empty Bullet Plugin
 *
 * Validates that list items have meaningful text content. Catches common
 * authoring mistakes like empty or placeholder bullet points that would render
 * as blank list markers. Only the immediate list-item level is checked; nested
 * sub-lists are not counted as content for the parent item.
 *
 * ## Rule
 *
 * | Slug           | Default severity | Description                   |
 * |----------------|------------------|-------------------------------|
 * | `empty-bullet` | critical         | List item has no text content |
 *
 * ## Frontmatter override
 *
 * ```yaml
 * check:
 *   empty-bullet: off       # disable this rule
 *   empty-bullet: warning    # downgrade to warning
 * ```
 *
 * ## Examples
 *
 * ```markdown
 * ## Experience
 * -                          <- empty-bullet (critical)
 * - Built scalable systems   <- OK
 * -                          <- empty-bullet (critical)
 * ```
 *
 * @module validator/plugins/empty-bullet
 */

import type Token from 'markdown-it/lib/token.mjs'
import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../types.js'
import { rangeFromToken } from '../utils.js'

/**
 * Extract text content from an inline token's children
 */
function extractTextFromInline(token: Token): string {
	if (!token.children) return token.content || ''
	return token.children
		.filter(t => t.type === 'text' || t.type === 'code_inline')
		.map(t => t.content)
		.join('')
		.trim()
}

/**
 * Empty Bullet plugin - validates content quality
 *
 * Checks:
 * - empty-bullet (critical): List item with no text content
 */
export const emptyBulletPlugin: ValidatorPlugin = {
	name: 'empty-bullet',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { tokens, lines } = ctx
		const issues: ValidationIssue[] = []

		// Scan for list items
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]
			if (!token) continue

			if (token.type === 'list_item_open') {
				// Collect all text content within this list item
				let content = ''
				let j = i + 1
				let depth = 1

				while (j < tokens.length && depth > 0) {
					const innerToken = tokens[j]
					if (!innerToken) break

					if (innerToken.type === 'list_item_open') {
						depth++
					} else if (innerToken.type === 'list_item_close') {
						depth--
					} else if (innerToken.type === 'inline' && depth === 1) {
						// Only count content at the immediate level
						content += extractTextFromInline(innerToken)
					}

					j++
				}

				// Check if the list item has no meaningful content
				if (content.trim() === '') {
					issues.push({
						severity: 'critical',
						code: 'empty-bullet',
						message: 'List item has no text content',
						range: rangeFromToken(token, lines),
					})
				}
			}
		}

		return issues
	},
}
