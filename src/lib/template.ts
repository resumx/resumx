/**
 * Template String Utilities
 *
 * Generic f-string style template expansion.
 * Replaces `{key}` with values from a vars map.
 */

const BRACE_PATTERN = /\{([^}]+)\}/g

/**
 * Validate that all `{...}` variables in the string are within the
 * allowed set. Throws listing the unknown ones and the valid choices.
 */
export function validateTemplateVars(
	template: string,
	validVars: string[],
): void {
	const valid = new Set(validVars)
	const unknown: string[] = []
	for (const match of template.matchAll(BRACE_PATTERN)) {
		if (!valid.has(match[1]!)) {
			unknown.push(match[1]!)
		}
	}
	if (unknown.length > 0) {
		throw new Error(
			`Unknown template variable(s): ${unknown.map(v => `{${v}}`).join(', ')}. `
				+ `Valid variables: ${validVars.map(v => `{${v}}`).join(', ')}`,
		)
	}
}

/**
 * Expand a template string by replacing `{key}` with values from vars.
 * Missing keys become empty string.
 */
export function expandTemplate(
	template: string,
	vars: Record<string, string>,
): string {
	return template.replace(BRACE_PATTERN, (_, name) => vars[name] ?? '')
}

/**
 * Validate that a template can produce unique results across all
 * dimension combinations. For each dimension with >1 value, the
 * template must include `{dimensionName}` or results would collide.
 */
export function validateTemplateUniqueness(
	template: string,
	dimensions: Record<string, string[]>,
): void {
	const missing: string[] = []
	for (const [name, values] of Object.entries(dimensions)) {
		if (values.length > 1 && !template.includes(`{${name}}`)) {
			missing.push(`{${name}}`)
		}
	}
	if (missing.length > 0) {
		throw new Error(
			`Template "${template}" would produce duplicates. `
				+ `Add ${missing.join(' and/or ')} to differentiate.`,
		)
	}
}
