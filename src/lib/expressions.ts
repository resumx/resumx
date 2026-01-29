/**
 * Expression parser module
 *
 * ⚠️ EXPERIMENTAL: The expression syntax and behavior are experimental and subject to change.
 *
 * Parses {{ }} syntax for JavaScript expressions, executes them with async auto-await,
 * and returns the result. Frontmatter properties are directly accessible in expressions.
 *
 * Syntax:
 *   {{ expr }}  - JavaScript expression with auto-await for Promises
 *   {{! cmd }}  - Shell command shortcut (equivalent to {{ exec('cmd') }})
 *
 * Examples:
 *   {{ new Date().getFullYear() }}
 *   {{ outputName }}
 *   {{ variables.company }}
 *   {{ (() => { const x = 5; return x * 2; })() }}
 *   {{ fetch(url).then(r => r.json()).then(d => d.name) }}
 *   {{! git log -1 --format="%h" }}
 *   {{! date +%Y }}
 */

import chalk from 'chalk'

/** Regex to match {{ expression }} or {{! command }} patterns */
const EXPRESSION_REGEX = /\{\{\s*(!?)\s*([\s\S]*?)\s*\}\}/g

/**
 * Evaluate and replace all {{ }} expressions in content with their evaluated results
 *
 * @param content - The markdown content containing expressions
 * @param context - Object containing variables accessible in expressions (e.g., frontmatter)
 * @returns Content with all expressions replaced by their evaluated results
 */
export async function processExpressions(
	content: string,
	context: Record<string, unknown>,
): Promise<string> {
	const matches = [...content.matchAll(EXPRESSION_REGEX)]

	if (matches.length === 0) {
		return content
	}

	let result = content

	// Process each match sequentially to handle async expressions
	for (const match of matches) {
		const [fullMatch, shellPrefix, expr] = match

		// If ! prefix, wrap command in exec() call
		const expression =
			shellPrefix === '!' ? `exec(${JSON.stringify(expr ?? '')})` : (expr ?? '')
		const value = await evaluateExpression(expression, context)
		result = result.replace(fullMatch, value)
	}

	return result
}

/**
 * Evaluate a JavaScript expression with context, auto-awaiting any Promise result
 *
 * @param expr - The JavaScript expression to evaluate
 * @param context - Object containing variables accessible in the expression
 * @returns The expression result converted to a string
 */
export async function evaluateExpression(
	expr: string,
	context: Record<string, unknown>,
): Promise<string> {
	// Handle empty expressions
	if (!expr.trim()) {
		return ''
	}

	try {
		// Create function with context variables as parameters
		// Wrap in async IIFE to auto-await any Promise result
		const fn = new Function(
			...Object.keys(context),
			`return (async () => { return ${expr} })()`,
		)

		// Execute with context values and await result
		const result = await fn(...Object.values(context))

		// Convert to string (handle different types)
		let output: string
		if (result === null || result === undefined) {
			output = ''
		} else if (typeof result === 'object') {
			output = JSON.stringify(result)
		} else {
			output = String(result)
		}

		// Log successful evaluation
		const truncatedExpr = expr.length > 60 ? expr.slice(0, 57) + '...' : expr
		const truncatedOutput =
			output.length > 40 ? output.slice(0, 37) + '...' : output
		console.log(
			`  ${chalk.cyan('expr')} {{ ${truncatedExpr} }} ${chalk.gray('→')} ${chalk.green(truncatedOutput || '(empty)')}`,
		)

		return output
	} catch (error) {
		// Log error but don't throw - return empty string to continue rendering
		const truncatedExpr = expr.length > 60 ? expr.slice(0, 57) + '...' : expr
		const errorMessage = error instanceof Error ? error.message : String(error)
		console.log(
			`  ${chalk.cyan('expr')} {{ ${truncatedExpr} }} ${chalk.gray('→')} ${chalk.red(`ERROR: ${errorMessage}`)}`,
		)

		// Return empty string on error - allows rendering to continue
		return ''
	}
}
