/**
 * No Sections Plugin
 *
 * Validates that the resume has at least one H2 heading representing a section
 * (e.g. Experience, Education, Skills). Without sections the resume is just a
 * wall of text with no semantic structure, which breaks both rendering and
 * readability.
 *
 * ## Rule
 *
 * | Slug           | Default severity | Description                               |
 * |----------------|------------------|-------------------------------------------|
 * | `no-sections`  | critical         | No H2 headings found (no resume sections) |
 *
 * ## Frontmatter override
 *
 * ```yaml
 * check:
 *   no-sections: off      # disable this rule
 *   no-sections: warning   # downgrade to warning
 * ```
 *
 * ## Expected structure
 *
 * ```markdown
 * # John Doe
 * > email@example.com
 *
 * ## Experience               <- H2 (at least one required)
 * ```
 *
 * @module validator/plugins/no-sections
 */

import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../types.js'
import { rangeAtStart } from '../utils.js'

/**
 * No Sections plugin - validates that resume has at least one H2 section
 *
 * Checks:
 * - no-sections (critical): No H2 headings found
 */
export const noSectionsPlugin: ValidatorPlugin = {
	name: 'no-sections',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { tokens } = ctx
		const issues: ValidationIssue[] = []

		let hasH2 = false

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]
			if (!token) continue

			if (token.type === 'heading_open' && token.tag === 'h2') {
				hasH2 = true
				break
			}
		}

		if (!hasH2) {
			issues.push({
				severity: 'critical',
				code: 'no-sections',
				message: 'Resume must have at least one section (H2 heading)',
				range: rangeAtStart(),
			})
		}

		return issues
	},
}
