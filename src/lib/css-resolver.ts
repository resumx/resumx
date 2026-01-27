import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Regex to match @import statements in CSS
 * Matches: @import 'file.css'; or @import "file.css"; or @import './path/file.css';
 * Does NOT match: @import url(...); (URL imports are left as-is)
 */
const IMPORT_REGEX = /@import\s+['"]([^'"]+)['"]\s*;/g

/**
 * Recursively resolve CSS @import statements and return merged CSS content
 *
 * This is a pure function with no side effects:
 * - Reads CSS files from disk
 * - Replaces @import statements with the actual file content
 * - Handles nested imports recursively
 * - Detects circular imports to prevent infinite loops
 * - Returns the merged CSS as a string
 *
 * @param cssPath - Absolute path to the CSS file to resolve
 * @returns Merged CSS content with all imports inlined
 * @throws Error if file not found or circular import detected
 */
export function resolveCssImports(cssPath: string): string {
	return resolveImportsRecursive(cssPath, new Set())
}

/**
 * Internal recursive function that tracks imported files to detect circular imports
 */
function resolveImportsRecursive(
	cssPath: string,
	importedFiles: Set<string>,
): string {
	// Normalize path to absolute
	const absolutePath = resolve(cssPath)

	// Check if file exists
	if (!existsSync(absolutePath)) {
		throw new Error(`CSS file not found: ${absolutePath}`)
	}

	// Detect circular imports
	if (importedFiles.has(absolutePath)) {
		throw new Error(
			`Circular import detected: ${absolutePath} is already imported`,
		)
	}

	// Immutable copy of the imported files Set
	const newImportedFiles = new Set(importedFiles)
	newImportedFiles.add(absolutePath)

	// Read CSS content
	const cssContent = readFileSync(absolutePath, 'utf-8')

	// Get directory of current CSS file for resolving relative imports
	const cssDir = dirname(absolutePath)

	// Replace all @import statements with their content
	const resolvedCSS = cssContent.replace(IMPORT_REGEX, (match, importPath) => {
		// Skip URL imports - leave them as-is for Pandoc/browser to handle
		if (
			importPath.startsWith('http://')
			|| importPath.startsWith('https://')
			|| importPath.startsWith('//')
		) {
			return match
		}

		// Resolve relative import path
		const resolvedImportPath = resolve(cssDir, importPath)

		try {
			// Recursively resolve imports in the imported file
			const importedContent = resolveImportsRecursive(
				resolvedImportPath,
				newImportedFiles,
			)

			return importedContent
		} catch (error) {
			// Provide context about which file failed to import
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error'
			throw new Error(
				`Failed to resolve import '${importPath}' in ${absolutePath}: ${errorMessage}`,
			)
		}
	})

	return resolvedCSS
}
