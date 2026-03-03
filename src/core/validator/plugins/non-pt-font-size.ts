/**
 * Non-pt Font Size Plugin
 *
 * PDF rendering uses `pt` as the canonical unit for font sizes. Browsers
 * interpret `px` differently across DPI settings, making PDF output
 * inconsistent. `em` and `rem` are relative to the rendered viewport, not
 * the page, so they scale unpredictably in print. Only `pt` guarantees that
 * "11pt" in the source produces "11pt" in the output PDF.
 *
 * ## Rule
 *
 * | Slug                | Default severity | Description                               |
 * |---------------------|------------------|-------------------------------------------|
 * | `non-pt-font-size`  | warning          | `font-size` style value uses a unit other than `pt` |
 *
 * ## Frontmatter override
 *
 * ```yaml
 * validate:
 *   rules:
 *     non-pt-font-size: off      # disable this rule
 *     non-pt-font-size: note     # downgrade to note
 * ```
 *
 * ## Examples
 *
 * ```yaml
 * style:
 *   font-size: 16px    <- non-pt-font-size (warning)
 *   font-size: 1em     <- non-pt-font-size (warning)
 *   font-size: 11pt    <- OK
 * ```
 *
 * @module validator/plugins/non-pt-font-size
 */

import { parseFrontmatterFromString } from '../../frontmatter.js'
import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../types.js'
import { rangeAtStart } from '../utils.js'

/** Matches a CSS value that ends with a unit that is NOT pt, e.g. 16px, 1em, 1.2rem, 120% */
const NON_PT_UNIT_PATTERN =
	/\d+(\.\d+)?(px|em|rem|vw|vh|vmin|vmax|%|cm|mm|in|pc)$/i

/**
 * Non-pt font-size plugin - warns when the `font-size` style option uses a
 * unit other than `pt`.
 */
export const nonPtFontSizePlugin: ValidatorPlugin = {
	name: 'non-pt-font-size',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const result = parseFrontmatterFromString(ctx.content)
		if (!result.ok || !result.config?.style) return []

		const fontSize = result.config.style['font-size']
		if (!fontSize) return []

		const value = String(fontSize).trim()
		if (!NON_PT_UNIT_PATTERN.test(value)) return []

		const unitMatch = value.match(/[a-z%]+$/i)
		const unit = unitMatch ? unitMatch[0] : 'unknown'

		return [
			{
				severity: 'critical',
				code: 'non-pt-font-size',
				message: `'font-size' should use 'pt' for consistent output (e.g. 11pt)`,
				range: rangeAtStart(),
			},
		]
	},
}
