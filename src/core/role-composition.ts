/**
 * Resolve a role name into its full set of constituent roles.
 *
 * Given a roleMap like `{ fullstack: ['frontend', 'backend'] }`,
 * resolving 'fullstack' returns `Set {'fullstack', 'frontend', 'backend'}`.
 * Expansion is recursive and cycle-safe.
 */
export function resolveRoleSet(
	roleName: string,
	roleMap: Record<string, string[]>,
	visited: Set<string> = new Set(),
): Set<string> {
	if (visited.has(roleName)) {
		const path = [...visited, roleName].join(' -> ')
		throw new Error(`Circular role composition detected: ${path}`)
	}

	const result = new Set<string>([roleName])
	const constituents = roleMap[roleName]
	if (!constituents) return result

	visited.add(roleName)

	for (const constituent of constituents) {
		for (const role of resolveRoleSet(constituent, roleMap, new Set(visited))) {
			result.add(role)
		}
	}

	return result
}
