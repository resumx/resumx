import type Token from 'markdown-it/lib/token.mjs'
import type { Range, Severity, ValidationIssue } from './types.js'

/** Create a range from markdown-it token's map property */
export function rangeFromToken(token: Token, lines: string[]): Range {
	// token.map is [startLine, endLine] (0-based, end exclusive)
	const [startLine, endLine] = token.map ?? [0, 1]
	return {
		start: { line: startLine, column: 0 },
		end: { line: endLine - 1, column: lines[endLine - 1]?.length ?? 0 },
	}
}

/** Create a range for a full line */
export function rangeForLine(line: number, lines: string[]): Range {
	return {
		start: { line, column: 0 },
		end: { line, column: lines[line]?.length ?? 0 },
	}
}

/** Create a range at document start (for document-level issues) */
export function rangeAtStart(): Range {
	return { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
}

/** Map severity to LSP severity code */
const severityToLsp: Record<Severity, 1 | 2 | 3 | 4> = {
	critical: 1,
	warning: 2,
	note: 3,
	bonus: 4,
}

/** LSP Diagnostic type (for reference, not a runtime dependency) */
export interface LspDiagnostic {
	range: {
		start: { line: number; character: number }
		end: { line: number; character: number }
	}
	severity: 1 | 2 | 3 | 4
	code?: string
	source?: string
	message: string
}

/** Convert ValidationIssue to LSP Diagnostic format */
export function toLspDiagnostic(issue: ValidationIssue): LspDiagnostic {
	return {
		range: {
			start: {
				line: issue.range.start.line,
				character: issue.range.start.column,
			},
			end: { line: issue.range.end.line, character: issue.range.end.column },
		},
		severity: severityToLsp[issue.severity],
		code: issue.code,
		source: 'resumx',
		message: issue.message,
	}
}
