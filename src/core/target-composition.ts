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

/**
 * Return all ancestor prefixes of a hierarchical tag, closest-first.
 * `data/ml/nlp` → `['data/ml', 'data']`
 * `backend` → `[]` (no hierarchy)
 */
export function getAncestorTags(tag: string): string[] {
	const parts = tag.split('/')
	if (parts.length <= 1) return []

	const ancestors: string[] = []
	for (let i = parts.length - 1; i >= 1; i--) {
		ancestors.push(parts.slice(0, i).join('/'))
	}
	return ancestors
}

/**
 * Return all content tags that are direct or transitive children of a tag.
 * `getDescendantTags('backend', ['backend/node', 'backend/jvm', 'frontend'])` → `['backend/node', 'backend/jvm']`
 */
export function getDescendantTags(
	tag: string,
	allContentTags: string[],
): string[] {
	const prefix = tag + '/'
	return allContentTags.filter(t => t.startsWith(prefix))
}

/**
 * Expand a single tag into its full lineage: ancestors + self + descendants.
 * Does NOT cascade: only looks up ancestors and descendants of the given tag,
 * not of any tags added by the expansion.
 */
export function expandLineage(
	tag: string,
	allContentTags: string[],
): Set<string> {
	const result = new Set<string>()
	result.add(tag)
	for (const a of getAncestorTags(tag)) result.add(a)
	for (const d of getDescendantTags(tag, allContentTags)) result.add(d)
	return result
}

/**
 * Resolve a tag name through composition, then expand lineage for each tag.
 *
 * Lineage expands per-original-tag (no cascading). Tags added as ancestors
 * do not trigger their own descendant expansion.
 */
export function resolveTagSetWithLineage(
	tagName: string,
	tagMap: Record<string, string[]>,
	allContentTags: string[],
): Set<string> {
	const compositionSet = resolveTagSet(tagName, tagMap)
	const result = new Set<string>()
	for (const tag of compositionSet) {
		for (const t of expandLineage(tag, allContentTags)) {
			result.add(t)
		}
	}
	return result
}
