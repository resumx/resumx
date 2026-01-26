import { existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve, isAbsolute, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getConfiguredDefaultStyle } from './config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Bundled styles directory (relative to compiled dist)
const BUNDLED_STYLES_DIR = resolve(__dirname, '../../styles')

// Fallback default style name (when no config)
export const FALLBACK_DEFAULT_STYLE = 'classic'

// Alias for backwards compatibility
export const DEFAULT_STYLE = FALLBACK_DEFAULT_STYLE

/**
 * Get the effective default style (global config > fallback)
 */
export function getDefaultStyle(): string {
	return getConfiguredDefaultStyle() ?? FALLBACK_DEFAULT_STYLE
}

// Available bundled styles
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
 * 4. Default to bundled classic
 */
export function resolveStyle(
	styleArg?: string,
	cwd: string = process.cwd(),
): string {
	// No style specified - use default
	if (!styleArg) {
		const defaultStyle = getDefaultStyle()

		// Check if local default exists
		const localDefault = getLocalStylePath(defaultStyle, cwd)
		if (localDefault) return localDefault

		// Use bundled default
		const bundledDefault = getBundledStylePath(defaultStyle)
		if (bundledDefault) return bundledDefault

		throw new Error(`Default style '${defaultStyle}' not found`)
	}

	// Path-like input (contains / or \ or ends with .css)
	if (
		styleArg.includes('/')
		|| styleArg.includes('\\')
		|| styleArg.endsWith('.css')
	) {
		const absolutePath =
			isAbsolute(styleArg) ? styleArg : resolve(cwd, styleArg)

		if (!existsSync(absolutePath)) {
			throw new Error(`Style file not found: ${absolutePath}`)
		}
		return absolutePath
	}

	// Name-based resolution
	const name = styleArg

	// Check local first
	const localPath = getLocalStylePath(name, cwd)
	if (localPath) return localPath

	// Check bundled
	const bundledPath = getBundledStylePath(name)
	if (bundledPath) return bundledPath

	throw new Error(
		`Style '${name}' not found. Available styles: ${BUNDLED_STYLES.join(', ')}`,
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
