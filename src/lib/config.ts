import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

// =============================================================================
// Global Config (~/.config/m8/config.json)
// =============================================================================

const GLOBAL_CONFIG_DIR = join(homedir(), '.config', 'resum8')
const GLOBAL_CONFIG_FILE = join(GLOBAL_CONFIG_DIR, 'config.json')

export interface GlobalConfig {
	defaultStyle?: string
	styleVariables?: Record<string, Record<string, string>>
}

/**
 * Get path to global config directory
 */
export function getGlobalConfigDir(): string {
	return GLOBAL_CONFIG_DIR
}

/**
 * Get path to global config file
 */
export function getConfigPath(): string {
	return GLOBAL_CONFIG_FILE
}

/**
 * Read global config
 * @param configDir - Optional config directory for testing
 */
export function readGlobalConfig(configDir?: string): GlobalConfig {
	const configFile =
		configDir ? join(configDir, 'config.json') : GLOBAL_CONFIG_FILE

	if (!existsSync(configFile)) {
		return {}
	}

	try {
		const content = readFileSync(configFile, 'utf-8')
		return JSON.parse(content) as GlobalConfig
	} catch {
		// Invalid JSON or read error - return empty config
		return {}
	}
}

/**
 * Write global config (merges with existing)
 * @param configDir - Optional config directory for testing
 */
export function writeGlobalConfig(
	updates: Partial<GlobalConfig>,
	configDir?: string,
): void {
	const dir = configDir ?? GLOBAL_CONFIG_DIR
	const configFile = join(dir, 'config.json')

	const existing = readGlobalConfig(configDir)
	const merged = { ...existing, ...updates }

	// Ensure config directory exists
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}

	writeFileSync(configFile, JSON.stringify(merged, null, 2) + '\n')
}

/**
 * Get the configured default style (or undefined if not set)
 */
export function getConfiguredDefaultStyle(): string | undefined {
	const config = readGlobalConfig()
	return config.defaultStyle
}

/**
 * Get per-style variable overrides from global config
 * @param styleName - The style name to get variables for
 * @param configDir - Optional config directory for testing
 */
export function getStyleVariables(
	styleName: string,
	configDir?: string,
): Record<string, string> {
	const config = readGlobalConfig(configDir)
	return config.styleVariables?.[styleName] ?? {}
}

/**
 * Set per-style variable overrides in global config
 * Merges with existing variables for the style
 * @param styleName - The style name to set variables for
 * @param variables - Variables to set (merged with existing)
 * @param configDir - Optional config directory for testing
 */
export function setStyleVariables(
	styleName: string,
	variables: Record<string, string>,
	configDir?: string,
): void {
	const config = readGlobalConfig(configDir)
	const existingStyleVars = config.styleVariables?.[styleName] ?? {}

	const updatedStyleVariables = {
		...config.styleVariables,
		[styleName]: { ...existingStyleVars, ...variables },
	}

	writeGlobalConfig({ styleVariables: updatedStyleVariables }, configDir)
}

/**
 * Reset per-style variable overrides in global config
 * Clears all variables for the given style
 * @param styleName - The style name to reset variables for
 * @param configDir - Optional config directory for testing
 */
export function resetStyleVariables(
	styleName: string,
	configDir?: string,
): void {
	const config = readGlobalConfig(configDir)
	const styleVariables = { ...config.styleVariables }

	// Remove the style's variables entirely
	delete styleVariables[styleName]

	writeGlobalConfig({ styleVariables }, configDir)
}

// =============================================================================
// Project Config (m8.config.json in cwd)
// =============================================================================

export const CONFIG_FILENAME = 'm8.config.json'

export interface ProjectConfig {
	style?: string
	variables?: Record<string, string>
}

/**
 * Load project config from cwd
 * Throws on invalid JSON or invalid config shape
 */
export function loadConfig(cwd: string = process.cwd()): ProjectConfig | null {
	const configPath = join(cwd, CONFIG_FILENAME)

	if (!existsSync(configPath)) {
		return null
	}

	const content = readFileSync(configPath, 'utf-8')

	let parsed: unknown
	try {
		parsed = JSON.parse(content)
	} catch {
		throw new Error(`Invalid JSON in ${CONFIG_FILENAME}`)
	}

	// Validate config shape
	if (typeof parsed !== 'object' || parsed === null) {
		throw new Error(`${CONFIG_FILENAME} must be an object`)
	}

	const config = parsed as Record<string, unknown>
	const style = config['style']
	const variables = config['variables']

	if (style !== undefined && typeof style !== 'string') {
		throw new Error("'style' must be a string")
	}

	if (variables !== undefined) {
		if (typeof variables !== 'object' || variables === null) {
			throw new Error("'variables' must be an object")
		}

		const varsObj = variables as Record<string, unknown>
		for (const [key, value] of Object.entries(varsObj)) {
			if (typeof value !== 'string') {
				throw new Error(`variable '${key}' must be a string`)
			}
		}
	}

	return {
		style: style as string | undefined,
		variables: variables as Record<string, string> | undefined,
	}
}

// =============================================================================
// Variable Utilities
// =============================================================================

/**
 * Parse CLI --var flags into a variables object
 * Input: ["primary-color=#ff0000", "font-size=14px"]
 * Output: { "primary-color": "#ff0000", "font-size": "14px" }
 * Throws on invalid format
 */
export function parseVarFlags(flags: string[]): Record<string, string> {
	const variables: Record<string, string> = {}

	for (const flag of flags) {
		const eqIndex = flag.indexOf('=')
		if (eqIndex === -1) {
			throw new Error(`Invalid --var format: '${flag}'. Expected name=value`)
		}

		const key = flag.slice(0, eqIndex)
		const value = flag.slice(eqIndex + 1)

		if (!key) {
			throw new Error('Variable name is empty')
		}

		variables[key] = value
	}

	return variables
}

/**
 * Merge variable objects (later objects override earlier)
 */
export function mergeVariables(
	...sources: (Record<string, string> | undefined)[]
): Record<string, string> {
	const result: Record<string, string> = {}

	for (const source of sources) {
		if (source) {
			Object.assign(result, source)
		}
	}

	return result
}

/**
 * Generate CSS variable overrides
 * Input: { "primary-color": "#ff0000" }
 * Output: ":root { --primary-color: #ff0000; }\n"
 */
export function generateVariablesCSS(
	variables: Record<string, string>,
): string {
	const entries = Object.entries(variables)
	if (entries.length === 0) return ''

	const declarations = entries
		.map(([key, value]) => `  --${key}: ${value};`)
		.join('\n')

	return `:root {\n${declarations}\n}\n`
}
