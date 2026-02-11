/**
 * Parse CLI --style flags: ["key=value"] -> { key: "value" }
 */
export function parseStyleFlags(flags: string[]): Record<string, string> {
	const result: Record<string, string> = {}

	for (const flag of flags) {
		const eq = flag.indexOf('=')
		if (eq === -1) {
			throw new Error(`Invalid --style format: '${flag}'. Expected name=value`)
		}
		const key = flag.slice(0, eq)
		if (!key) {
			throw new Error('Style name is empty')
		}
		result[key] = flag.slice(eq + 1)
	}

	return result
}
