/**
 * Spaced Bracketed Span Plugin
 *
 * Detects `[text] {.class}` where a space between `]` and `{` prevents the
 * bracketed span from being parsed. The correct syntax is `[text]{.class}`
 * with no space.
 *
 * ## Rule
 *
 * | Slug                      | Default severity | Description                               |
 * |---------------------------|------------------|-------------------------------------------|
 * | `spaced-bracketed-span`   | warning          | Space between `]` and `{` breaks span     |
 *
 * ## Frontmatter override
 *
 * ```yaml
 * validate:
 *   rules:
 *     spaced-bracketed-span: off
 * ```
 *
 * ## Examples
 *
 * ```markdown
 * [TypeScript, React] {.@frontend}     <- spaced-bracketed-span (warning)
 * [TypeScript, React]{.@frontend}      <- OK
 * - Built a dashboard {.@frontend}     <- OK (block-level attrs, not a span)
 * ```
 *
 * @module validator/plugins/spaced-bracketed-span
 */

import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../types.js'

const SPACED_BRACKET_RE = /\[([^\]]+)\]\s+(\{[^}]+\})/g
const CODE_FENCE_RE = /^(`{3,}|~{3,})/

export const spacedBracketedSpanPlugin: ValidatorPlugin = {
	name: 'spaced-bracketed-span',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { lines } = ctx
		const issues: ValidationIssue[] = []
		let inCodeBlock = false

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]
			if (line === undefined) continue

			if (CODE_FENCE_RE.test(line.trimStart())) {
				inCodeBlock = !inCodeBlock
				continue
			}
			if (inCodeBlock) continue

			SPACED_BRACKET_RE.lastIndex = 0
			let match: RegExpExecArray | null
			while ((match = SPACED_BRACKET_RE.exec(line)) !== null) {
				const bracketContent = match[1]!
				const attrsBlock = match[2]!
				const fixed = `[${bracketContent}]${attrsBlock}`

				issues.push({
					severity: 'warning',
					code: 'spaced-bracketed-span',
					message: `Space between ] and { prevents this from being a bracketed span — use ${fixed} instead`,
					range: {
						start: { line: i, column: match.index },
						end: { line: i, column: match.index + match[0].length },
					},
				})
			}
		}

		return issues
	},
}
