import { existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve, isAbsolute, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Bundled themes directory (relative to compiled dist)
const BUNDLED_THEMES_DIR = resolve(__dirname, '../../themes')

// Default theme name (single source of truth)
export const DEFAULT_THEME = 'zurich'

// =============================================================================
// CSS Variable Utilities
// =============================================================================

export type ThemeVariables = Record<string, string>

/**
 * Merge variable objects (later wins)
 */
export function mergeVariables(
	...sources: (ThemeVariables | undefined)[]
): ThemeVariables {
	return Object.assign({}, ...sources.filter(Boolean))
}

/**
 * Generate CSS :root block from variables
 */
export function generateVariablesCSS(variables: ThemeVariables): string {
	const entries = Object.entries(variables)
	if (entries.length === 0) return ''

	const declarations = entries
		.map(([key, value]) => `  --${key}: ${value};`)
		.join('\n')

	return `:root {\n${declarations}\n}\n`
}

// =============================================================================
// Theme Resolution
// =============================================================================
/**
 * Discover bundled theme names from top-level .css files in the themes directory
 */
function discoverBundledThemes(): string[] {
	if (!existsSync(BUNDLED_THEMES_DIR)) return []
	return readdirSync(BUNDLED_THEMES_DIR)
		.filter(f => f.endsWith('.css'))
		.map(f => basename(f, '.css'))
		.sort()
}

/** Lazily-cached list of bundled theme names */
let _bundledThemesCache: string[] | null = null

export function getBundledThemes(): string[] {
	if (!_bundledThemesCache) {
		_bundledThemesCache = discoverBundledThemes()
	}
	return _bundledThemesCache
}

export interface ThemeInfo {
	name: string
	path: string
	isLocal: boolean
	isBundled: boolean
}

export interface CssVariable {
	name: string
	value: string
}

/**
 * Get path to bundled themes directory
 */
export function getBundledThemesDir(): string {
	return BUNDLED_THEMES_DIR
}

/**
 * Get path to a bundled theme
 */
export function getBundledThemePath(name: string): string | undefined {
	const themePath = join(BUNDLED_THEMES_DIR, `${name}.css`)
	return existsSync(themePath) ? themePath : undefined
}

/**
 * Get path to local themes directory
 */
export function getLocalThemesDir(cwd: string = process.cwd()): string {
	return join(cwd, 'themes')
}

/**
 * Get path to a local theme
 */
export function getLocalThemePath(
	name: string,
	cwd: string = process.cwd(),
): string | undefined {
	const themePath = join(getLocalThemesDir(cwd), `${name}.css`)
	return existsSync(themePath) ? themePath : undefined
}

/**
 * List all available themes (local + bundled)
 */
export function listThemes(cwd: string = process.cwd()): ThemeInfo[] {
	const themes: ThemeInfo[] = []
	const seen = new Set<string>()

	// Local themes first (higher priority)
	const localDir = getLocalThemesDir(cwd)
	if (existsSync(localDir)) {
		const localFiles = readdirSync(localDir).filter(f => f.endsWith('.css'))
		for (const file of localFiles) {
			const name = basename(file, '.css')
			themes.push({
				name,
				path: join(localDir, file),
				isLocal: true,
				isBundled: getBundledThemes().includes(name),
			})
			seen.add(name)
		}
	}

	// Bundled themes (not already shadowed by local)
	for (const name of getBundledThemes()) {
		if (!seen.has(name)) {
			themes.push({
				name,
				path: join(BUNDLED_THEMES_DIR, `${name}.css`),
				isLocal: false,
				isBundled: true,
			})
		}
	}

	return themes
}

/**
 * Resolve a theme name or path to an absolute CSS file path
 *
 * Resolution order:
 * 1. If it's a path (contains / or ends with .css), use it directly
 * 2. Check ./themes/<name>.css (local override)
 * 3. Check bundled themes
 *
 * Callers are responsible for providing a theme name (handling defaults).
 */
export function resolveTheme(
	theme: string,
	cwd: string = process.cwd(),
): string {
	// Path-like input (contains / or \ or ends with .css)
	if (theme.includes('/') || theme.includes('\\') || theme.endsWith('.css')) {
		const absolutePath = isAbsolute(theme) ? theme : resolve(cwd, theme)

		if (!existsSync(absolutePath)) {
			throw new Error(`Theme file not found: ${absolutePath}`)
		}
		return absolutePath
	}

	// Name-based resolution
	// Check local first
	const localPath = getLocalThemePath(theme, cwd)
	if (localPath) return localPath

	// Check bundled
	const bundledPath = getBundledThemePath(theme)
	if (bundledPath) return bundledPath

	throw new Error(
		`Theme '${theme}' not found. Available themes: ${getBundledThemes().join(', ')}`,
	)
}

/**
 * Parse CSS custom properties (variables) from a CSS string
 *
 * Extracts variables defined in :root { ... } blocks
 */
export function parseCssVariables(css: string): CssVariable[] {
	// Match :root { ... } block
	const rootMatch = css.match(/:root\s*\{([^}]+)\}/)
	if (!rootMatch) {
		return []
	}

	const rootContent = rootMatch[1]
	if (!rootContent) {
		return []
	}

	const variables: CssVariable[] = []

	// Match CSS custom properties: --name: value;
	// Handle multiline values by matching until the next semicolon
	const varRegex = /(--[\w-]+)\s*:\s*([^;]+);/g
	let match: RegExpExecArray | null

	while ((match = varRegex.exec(rootContent)) !== null) {
		const name = match[1]
		const rawValue = match[2]
		if (!name || !rawValue) {
			continue
		}
		// Normalize whitespace in value (collapse newlines and multiple spaces)
		const value = rawValue.replace(/\s+/g, ' ').trim()
		variables.push({ name, value })
	}

	return variables
}
