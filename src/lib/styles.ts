import { existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve, isAbsolute, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Bundled styles directory (relative to compiled dist)
const BUNDLED_STYLES_DIR = resolve(__dirname, '../../styles')

// Fallback default style name (when no config)
export const FALLBACK_DEFAULT_STYLE = 'classic'

// =============================================================================
// CSS Variable Utilities
// =============================================================================

export type StyleVariables = Record<string, string>

/**
 * Merge variable objects (later wins)
 */
export function mergeVariables(
	...sources: (StyleVariables | undefined)[]
): StyleVariables {
	return Object.assign({}, ...sources.filter(Boolean))
}

/**
 * Generate CSS :root block from variables
 */
export function generateVariablesCSS(variables: StyleVariables): string {
	const entries = Object.entries(variables)
	if (entries.length === 0) return ''

	const declarations = entries
		.map(([key, value]) => `  --${key}: ${value};`)
		.join('\n')

	return `:root {\n${declarations}\n}\n`
}

// =============================================================================
// Style Resolution
// =============================================================================
export const BUNDLED_STYLES = ['classic', 'formal', 'minimal'] as const
export type BundledStyle = (typeof BUNDLED_STYLES)[number]

export interface StyleInfo {
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
 * Get path to bundled styles directory
 */
export function getBundledStylesDir(): string {
	return BUNDLED_STYLES_DIR
}

/**
 * Get path to a bundled style
 */
export function getBundledStylePath(name: string): string | undefined {
	const stylePath = join(BUNDLED_STYLES_DIR, `${name}.css`)
	return existsSync(stylePath) ? stylePath : undefined
}

/**
 * Get path to local styles directory
 */
export function getLocalStylesDir(cwd: string = process.cwd()): string {
	return join(cwd, 'styles')
}

/**
 * Get path to a local style
 */
export function getLocalStylePath(
	name: string,
	cwd: string = process.cwd(),
): string | undefined {
	const stylePath = join(getLocalStylesDir(cwd), `${name}.css`)
	return existsSync(stylePath) ? stylePath : undefined
}

/**
 * List all available styles (local + bundled)
 */
export function listStyles(cwd: string = process.cwd()): StyleInfo[] {
	const styles: StyleInfo[] = []
	const seen = new Set<string>()

	// Local styles first (higher priority)
	const localDir = getLocalStylesDir(cwd)
	if (existsSync(localDir)) {
		const localFiles = readdirSync(localDir).filter(f => f.endsWith('.css'))
		for (const file of localFiles) {
			const name = basename(file, '.css')
			styles.push({
				name,
				path: join(localDir, file),
				isLocal: true,
				isBundled: BUNDLED_STYLES.includes(name as BundledStyle),
			})
			seen.add(name)
		}
	}

	// Bundled styles (not already shadowed by local)
	for (const name of BUNDLED_STYLES) {
		if (!seen.has(name)) {
			styles.push({
				name,
				path: join(BUNDLED_STYLES_DIR, `${name}.css`),
				isLocal: false,
				isBundled: true,
			})
		}
	}

	return styles
}

/**
 * Resolve a style name or path to an absolute CSS file path
 *
 * Resolution order:
 * 1. If it's a path (contains / or ends with .css), use it directly
 * 2. Check ./styles/<name>.css (local override)
 * 3. Check bundled styles
 *
 * Callers are responsible for providing a style name (handling defaults).
 */
export function resolveStyle(
	style: string,
	cwd: string = process.cwd(),
): string {
	// Path-like input (contains / or \ or ends with .css)
	if (style.includes('/') || style.includes('\\') || style.endsWith('.css')) {
		const absolutePath = isAbsolute(style) ? style : resolve(cwd, style)

		if (!existsSync(absolutePath)) {
			throw new Error(`Style file not found: ${absolutePath}`)
		}
		return absolutePath
	}

	// Name-based resolution
	// Check local first
	const localPath = getLocalStylePath(style, cwd)
	if (localPath) return localPath

	// Check bundled
	const bundledPath = getBundledStylePath(style)
	if (bundledPath) return bundledPath

	throw new Error(
		`Style '${style}' not found. Available styles: ${BUNDLED_STYLES.join(', ')}`,
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
