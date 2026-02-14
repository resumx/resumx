/**
 * No Entries Plugin
 *
 * Validates that the resume has at least one H3 heading representing an entry
 * (job, degree, project, etc.). While a resume can technically render without
 * entries, their absence usually means the content is unstructured or
 * incomplete. This is a warning rather than critical because some resume
 * formats (e.g. skills-only) may legitimately omit H3 headings.
 *
 * ## Rule
 *
 * | Slug          | Default severity | Description                                     |
 * |---------------|------------------|-------------------------------------------------|
 * | `no-entries`  | warning          | No H3 headings found (no job/education entries) |
 *
 * ## Frontmatter override
 *
 * ```yaml
 * check:
 *   no-entries: off       # disable this rule
 *   no-entries: critical   # upgrade to critical
 * ```
 *
 * ## Expected structure
 *
 * ```markdown
 * # John Doe
 * > email@example.com
 *
 * ## Experience
 * ### Company Name             <- H3 (recommended)
 * - Built things
 * ```
 *
 * @module validator/plugins/no-entries
 */

import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../types.js'
import { rangeAtStart } from '../utils.js'

/**
 * No Entries plugin - validates that resume has H3 entries
 *
 * Checks:
 * - no-entries (warning): No H3 headings found
 */
export const noEntriesPlugin: ValidatorPlugin = {
	name: 'no-entries',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { tokens } = ctx
		const issues: ValidationIssue[] = []

		let hasH3 = false

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]
			if (!token) continue

			if (token.type === 'heading_open' && token.tag === 'h3') {
				hasH3 = true
				break
			}
		}

		if (!hasH3) {
			issues.push({
				severity: 'warning',
				code: 'no-entries',
				message: 'Resume has no entries (H3 headings)',
				range: rangeAtStart(),
			})
		}

		return issues
	},
}
