/**
 * Extract all @-prefixed tag names from a CSS class string.
 * Returns them in the order they appear.
 */
export function extractTagNames(className: string): string[] {
	const re = /@([^\s"']+)/g
	const tags: string[] = []
	let m: RegExpExecArray | null
	while ((m = re.exec(className))) tags.push(m[1]!)
	return tags
}

/**
 * Resolve a tag name into its full set of constituent tags.
 *
 * Given a tagMap like `{ fullstack: ['frontend', 'backend'] }`,
 * resolving 'fullstack' returns `Set {'fullstack', 'frontend', 'backend'}`.
 * Expansion is recursive and cycle-safe.
 */
export function resolveTagSet(
	tagName: string,
	tagMap: Record<string, string[]>,
	visited: Set<string> = new Set(),
): Set<string> {
	if (visited.has(tagName)) {
		const path = [...visited, tagName].join(' -> ')
		throw new Error(`Circular tag composition detected: ${path}`)
	}

	const result = new Set<string>([tagName])
	const constituents = tagMap[tagName]
	if (!constituents) return result

	visited.add(tagName)

	for (const constituent of constituents) {
		for (const tag of resolveTagSet(constituent, tagMap, new Set(visited))) {
			result.add(tag)
		}
	}

	return result
}
