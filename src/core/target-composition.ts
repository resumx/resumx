/**
 * Resolve a target name into its full set of constituent targets.
 *
 * Given a targetMap like `{ fullstack: ['frontend', 'backend'] }`,
 * resolving 'fullstack' returns `Set {'fullstack', 'frontend', 'backend'}`.
 * Expansion is recursive and cycle-safe.
 */
export function resolveTargetSet(
	targetName: string,
	targetMap: Record<string, string[]>,
	visited: Set<string> = new Set(),
): Set<string> {
	if (visited.has(targetName)) {
		const path = [...visited, targetName].join(' -> ')
		throw new Error(`Circular target composition detected: ${path}`)
	}

	const result = new Set<string>([targetName])
	const constituents = targetMap[targetName]
	if (!constituents) return result

	visited.add(targetName)

	for (const constituent of constituents) {
		for (const target of resolveTargetSet(
			constituent,
			targetMap,
			new Set(visited),
		)) {
			result.add(target)
		}
	}

	return result
}
