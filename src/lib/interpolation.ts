/**
 * Expression Parser Module
 * Parses {{ }} syntax for JavaScript expressions with async auto-await
 */

interface Expression {
	fullMatch: string
	expr: string
	start: number
	end: number
}

/**
 * Parser state for tracking delimiters, braces, and strings
 */
class ParserState {
	delimiterDepth = 1 // Start at 1 for the opening {{
	jsBraceDepth = 0
	inString: null | '"' | "'" | '`' = null

	isInsideString(): boolean {
		return this.inString !== null
	}

	isDelimiterClosed(): boolean {
		return this.delimiterDepth === 0
	}

	toggleString(quote: '"' | "'" | '`'): void {
		if (this.inString === quote) {
			this.inString = null // Close string
		} else if (!this.inString) {
			this.inString = quote // Open string
		}
	}

	incrementDelimiter(): void {
		this.delimiterDepth++
	}

	decrementDelimiter(): void {
		this.delimiterDepth--
	}

	incrementJsBrace(): void {
		this.jsBraceDepth++
	}

	decrementJsBrace(): void {
		this.jsBraceDepth--
	}

	canCloseDelimiter(): boolean {
		return this.jsBraceDepth === 0
	}
}

/**
 * Find the closing }} for an expression, handling nested braces and strings
 */
function findClosingDelimiter(content: string, start: number): number | null {
	const state = new ParserState()
	let i = start

	while (i < content.length) {
		const char = content[i]
		const nextChar = i < content.length - 1 ? content[i + 1] : ''

		// Handle escape sequences inside strings (skip them)
		if (state.isInsideString() && char === '\\' && nextChar) {
			i += 2
			continue
		}

		// Handle string delimiters
		if (char === '"' || char === "'" || char === '`') {
			state.toggleString(char)
			i++
			continue
		}

		// Ignore all braces and delimiters inside strings
		if (state.isInsideString()) {
			i++
			continue
		}

		// Track {{ }} delimiters and { } braces outside strings
		if (char === '{' && nextChar === '{') {
			state.incrementDelimiter()
			i += 2
		} else if (char === '}' && nextChar === '}') {
			if (state.canCloseDelimiter()) {
				state.decrementDelimiter()
				if (state.isDelimiterClosed()) {
					return i // Found matching }}
				}
				i += 2
			} else {
				// Have unmatched JS braces, treat as two separate }
				state.decrementJsBrace()
				i++
			}
		} else if (char === '{') {
			state.incrementJsBrace()
			i++
		} else if (char === '}') {
			state.decrementJsBrace()
			i++
		} else {
			i++
		}
	}

	return null // No matching }} found
}

/**
 * Extract all {{ }} expressions from content, handling nested braces and string literals
 */
function extractExpressions(content: string): Expression[] {
	const expressions: Expression[] = []
	let i = 0

	while (i < content.length - 1) {
		// Look for opening {{
		if (content[i] === '{' && content[i + 1] === '{') {
			const start = i
			const exprStart = i + 2

			const closingPos = findClosingDelimiter(content, exprStart)

			if (closingPos !== null) {
				const end = closingPos + 2
				const fullMatch = content.slice(start, end)
				const expr = content.slice(exprStart, closingPos).trim()
				expressions.push({ fullMatch, expr, start, end })
				i = end
			} else {
				// No matching }}, skip this {{
				i += 2
			}
		} else {
			i++
		}
	}

	return expressions
}

/**
 * Evaluate a JavaScript expression with context, auto-awaiting any Promise result
 * Returns empty string on error to gracefully handle invalid expressions
 */
export async function evaluateExpression(
	expr: string,
	context: Record<string, unknown>,
): Promise<string> {
	try {
		// Create function with context variables as parameters
		const fn = new Function(
			...Object.keys(context),
			`return (async () => { return ${expr} })()`,
		)

		// Execute with context values and await result
		const result = await fn(...Object.values(context))

		// Convert to string (handle objects via JSON)
		if (result === null || result === undefined) {
			return ''
		}
		if (typeof result === 'object') {
			return JSON.stringify(result)
		}
		return String(result)
	} catch {
		// Return empty string on error
		return ''
	}
}

/**
 * Process all {{ }} expressions in content, replacing them with evaluated results
 */
export async function processExpressions(
	content: string,
	context: Record<string, unknown>,
): Promise<string> {
	const expressions = extractExpressions(content)

	if (expressions.length === 0) return content

	// Process in reverse order to avoid index shifting issues
	let result = content
	for (let i = expressions.length - 1; i >= 0; i--) {
		const expression = expressions[i]
		if (!expression) continue
		const { expr, start, end } = expression
		const value = await evaluateExpression(expr, context)
		result = result.slice(0, start) + value + result.slice(end)
	}

	return result
}
