import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Regex to match CSS block comments OR @import statements.
 * By matching comments first (group 1), we can skip @import statements
 * that appear inside comments. The import path is captured in group 2.
 *
 * Matches: @import 'file.css'; or @import "file.css"; or @import './path/file.css';
 * Skips: @import inside block comments, @import url(...) (URL imports are left as-is)
 */
const COMMENT_OR_IMPORT_REGEX =
	/(\/\*[\s\S]*?\*\/)|@import\s+['"]([^'"]+)['"]\s*;/g

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
 * @param fallbackDir - Optional fallback directory to resolve imports that
 *   aren't found relative to the importing file (e.g. bundled styles dir)
 * @returns Merged CSS content with all imports inlined
 * @throws Error if file not found or circular import detected
 */
export function resolveCssImports(
	cssPath: string,
	fallbackDir?: string,
): string {
	return resolveImportsRecursive(cssPath, new Set(), fallbackDir)
}

/**
 * Internal recursive function that tracks imported files to detect circular imports
 */
function resolveImportsRecursive(
	cssPath: string,
	importedFiles: Set<string>,
	fallbackDir?: string,
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

	// Replace all @import statements with their content, skipping those inside comments
	const resolvedCSS = cssContent.replace(
		COMMENT_OR_IMPORT_REGEX,
		(match, comment: string | undefined, importPath: string | undefined) => {
			// If this match is a block comment, preserve it as-is
			if (comment) {
				return match
			}

			// importPath is guaranteed to be defined here (non-comment branch)
			const path = importPath!

			// Skip URL imports - leave them as-is for Pandoc/browser to handle
			if (
				path.startsWith('http://')
				|| path.startsWith('https://')
				|| path.startsWith('//')
			) {
				return match
			}

			// Resolve relative import path
			let resolvedImportPath = resolve(cssDir, path)

			// Fallback to the provided directory if not found locally
			if (!existsSync(resolvedImportPath) && fallbackDir) {
				resolvedImportPath = resolve(fallbackDir, path)
			}

			try {
				// Recursively resolve imports in the imported file
				const importedContent = resolveImportsRecursive(
					resolvedImportPath,
					newImportedFiles,
					fallbackDir,
				)

				return importedContent
			} catch (error) {
				// Provide context about which file failed to import
				const errorMessage =
					error instanceof Error ? error.message : 'Unknown error'
				throw new Error(
					`Failed to resolve import '${path}' in ${absolutePath}: ${errorMessage}`,
				)
			}
		},
	)

	return resolvedCSS
}
