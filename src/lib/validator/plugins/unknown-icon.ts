/**
 * Unknown Icon Plugin
 *
 * Validates `::icon::` references in the resume, ensuring they point to a
 * known icon in Devicon or Logos. Icons using special prefixes (Iconify colon
 * syntax, `gh:`, `wiki:`) are assumed valid because they resolve through
 * external services that cannot be statically checked.
 *
 * ## Rule
 *
 * | Slug           | Default severity | Description                                  |
 * |----------------|------------------|----------------------------------------------|
 * | `unknown-icon` | warning          | Icon reference not found in any icon library |
 *
 * ## Frontmatter override
 *
 * ```yaml
 * check:
 *   unknown-icon: off        # disable this rule
 *   unknown-icon: critical    # upgrade to critical
 * ```
 *
 * ## Supported icon sources
 *
 * - **Devicon**: Technology and programming icons (e.g. `::react::`, `::typescript::`)
 * - **Logos**: Brand and company logos (e.g. `::netflix::`, `::spotify::`)
 * - **Iconify**: Any Iconify icon set with colon syntax (e.g. `::mdi:home::`) -- not validated
 * - **GitHub**: GitHub user/org avatars (e.g. `::gh:octocat::`) -- not validated
 * - **Wikimedia**: Wikipedia/Commons images (e.g. `::wiki:path/to/icon.svg::`) -- not validated
 *
 * ## Examples
 *
 * ```markdown
 * ## Skills
 * ::react:: React           <- OK (devicon)
 * ::typescript:: TypeScript <- OK (devicon)
 * ::mdi:home:: Home         <- OK (Iconify format, not validated)
 * ::nonexistent:: Unknown   <- unknown-icon (warning)
 * ```
 *
 * @module validator/plugins/unknown-icon
 */

import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../types.js'
import { deviconMap } from '../../mdit-plugins/icon/mappings/devicon.js'
import { logosMap } from '../../mdit-plugins/icon/mappings/logos.js'

/** Icon syntax pattern: ::name:: */
const ICON_PATTERN = /::([^:\s][^:]*?)::/g

/** Special prefixes that have their own resolvers (not validated against maps) */
const SPECIAL_PREFIXES = [
	'wiki:',
	'wikimedia-commons:',
	'gh:',
	'github:',
	// Iconify format with colon (e.g., mdi:home, fa:user)
]

/**
 * Check if an icon name uses a special prefix or Iconify format
 */
function isSpecialIcon(name: string): boolean {
	// Check for special prefixes
	for (const prefix of SPECIAL_PREFIXES) {
		if (name.startsWith(prefix)) {
			return true
		}
	}
	// Check for Iconify format (contains colon, e.g., mdi:home)
	if (name.includes(':')) {
		return true
	}
	return false
}

/**
 * Check if an icon name is valid (exists in deviconMap or logosMap)
 */
function isValidIcon(name: string): boolean {
	// Special icons are always considered valid (handled by other resolvers)
	if (isSpecialIcon(name)) {
		return true
	}
	// Check devicon and logos maps
	return name in deviconMap || name in logosMap
}

/**
 * Unknown Icon plugin - validates icon references
 *
 * Checks:
 * - unknown-icon (warning): Icon reference not found in deviconMap or logosMap
 */
export const unknownIconPlugin: ValidatorPlugin = {
	name: 'unknown-icon',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { lines } = ctx
		const issues: ValidationIssue[] = []

		// Scan each line for icon references
		for (let lineNum = 0; lineNum < lines.length; lineNum++) {
			const line = lines[lineNum]
			if (!line) continue

			let match

			// Reset regex for each line
			ICON_PATTERN.lastIndex = 0

			while ((match = ICON_PATTERN.exec(line)) !== null) {
				const iconName = match[1]
				if (!iconName) continue

				if (!isValidIcon(iconName)) {
					issues.push({
						severity: 'warning',
						code: 'unknown-icon',
						message: `Unknown icon: ::${iconName}::`,
						range: {
							start: { line: lineNum, column: match.index },
							end: { line: lineNum, column: match.index + match[0].length },
						},
					})
				}
			}
		}

		return issues
	},
}
