/**
 * Long Bullet Plugin
 *
 * Detects bullet points that exceed character-length limits. Uses two tiers:
 * a warning threshold (default 140 chars) and a critical threshold (default
 * 200 chars). Only the immediate text of each list item is measured; nested
 * sub-lists are excluded.
 *
 * Recruiters spend ~6 seconds scanning a resume. Long bullets are harder to
 * parse at a glance and often indicate content that should be split, condensed,
 * or promoted to its own entry.
 *
 * ## Rule
 *
 * | Slug          | Default severity | Description                       |
 * |---------------|------------------|-----------------------------------|
 * | `long-bullet` | warning / critical | Bullet exceeds character threshold |
 *
 * The severity depends on which threshold is exceeded:
 * - `> 140` chars (default) -> warning
 * - `> 200` chars (default) -> critical
 *
 * ## Frontmatter override
 *
 * ```yaml
 * check:
 *   long-bullet: off       # disable this rule
 *   long-bullet: note       # downgrade both tiers to note
 * ```
 *
 * ## Examples
 *
 * ```markdown
 * ## Experience
 * ### Company
 * - This is a moderately long bullet point that exceeds 140 characters
 *   but stays under 200...  <- long-bullet (warning)
 *
 * - This is a very long bullet point that exceeds the maximum of 200
 *   characters and goes on and on...  <- long-bullet (critical)
 * ```
 *
 * @module validator/plugins/long-bullet
 */

import type Token from 'markdown-it/lib/token.mjs'
import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../types.js'
import { rangeFromToken } from '../utils.js'

/** Configuration options for the long bullet plugin */
export interface LongBulletOptions {
	/** Threshold for warning severity (default: 140) */
	warnThreshold?: number
	/** Threshold for critical severity (default: 200) */
	criticalThreshold?: number
}

/** Default thresholds */
const DEFAULT_WARN_THRESHOLD = 140
const DEFAULT_CRITICAL_THRESHOLD = 200

/**
 * Extract text content from an inline token's children
 */
function extractTextFromInline(token: Token): string {
	if (!token.children) return token.content || ''
	return token.children
		.filter(t => t.type === 'text' || t.type === 'code_inline')
		.map(t => t.content)
		.join('')
}

/**
 * Get the content length of a list item (immediate level only)
 */
function getListItemContentLength(
	tokens: Token[],
	startIndex: number,
): { length: number; endIndex: number } {
	let content = ''
	let j = startIndex + 1
	let depth = 1

	while (j < tokens.length && depth > 0) {
		const token = tokens[j]
		if (!token) break

		if (token.type === 'list_item_open') {
			depth++
		} else if (token.type === 'list_item_close') {
			depth--
		} else if (token.type === 'inline' && depth === 1) {
			content += extractTextFromInline(token)
		}

		j++
	}

	return { length: content.trim().length, endIndex: j }
}

/**
 * Create a long bullet plugin with configurable thresholds
 *
 * @param options - Configuration options
 * @returns ValidatorPlugin instance
 *
 * @example
 * ```typescript
 * // Use default thresholds (warn: 140, error: 200)
 * const plugin = createLongBulletPlugin()
 *
 * // Custom thresholds
 * const strictPlugin = createLongBulletPlugin({
 *   warnThreshold: 100,
 *   errorThreshold: 150,
 * })
 * ```
 */
export function createLongBulletPlugin(
	options: LongBulletOptions = {},
): ValidatorPlugin {
	const warnThreshold = options.warnThreshold ?? DEFAULT_WARN_THRESHOLD
	const criticalThreshold =
		options.criticalThreshold ?? DEFAULT_CRITICAL_THRESHOLD

	return {
		name: 'long-bullet',

		validate(ctx: ValidationContext): ValidationIssue[] {
			const { tokens, lines } = ctx
			const issues: ValidationIssue[] = []

			for (let i = 0; i < tokens.length; i++) {
				const token = tokens[i]
				if (!token) continue

				if (token.type === 'list_item_open') {
					const { length } = getListItemContentLength(tokens, i)

					if (length > criticalThreshold) {
						issues.push({
							severity: 'critical',
							code: 'long-bullet',
							message: `Bullet exceeds ${criticalThreshold} characters (${length})`,
							range: rangeFromToken(token, lines),
						})
					} else if (length > warnThreshold) {
						issues.push({
							severity: 'warning',
							code: 'long-bullet',
							message: `Bullet exceeds ${warnThreshold} characters (${length})`,
							range: rangeFromToken(token, lines),
						})
					}
				}
			}

			return issues
		},
	}
}

/**
 * Default long bullet plugin with standard thresholds
 * - Warning: > 140 characters
 * - Critical: > 200 characters
 */
export const longBulletPlugin = createLongBulletPlugin()
