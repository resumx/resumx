import chalk from 'chalk'
import { validate } from '../core/validator/index.js'
import type {
	Severity,
	PresetName,
	RuleOverrides,
	ValidationIssue,
	ValidationResult,
} from '../core/validator/types.js'

export interface ValidateConfig {
	extends?: PresetName
	rules?: RuleOverrides
}

export interface CheckOptions {
	strict?: boolean
	minSeverity?: Severity
	validateConfig?: ValidateConfig
}

export interface CheckResult {
	result: ValidationResult
	filteredIssues: ValidationIssue[]
	/** true when rendering should proceed */
	ok: boolean
}

/** Severity order for filtering */
export const severityOrder: Record<Severity, number> = {
	critical: 0,
	warning: 1,
	note: 2,
	bonus: 3,
}

/** Colors for each severity level */
const severityColors: Record<Severity, (text: string) => string> = {
	critical: chalk.red,
	warning: chalk.yellow,
	note: chalk.blue,
	bonus: chalk.gray,
}

/**
 * Format an issue for display
 */
export function formatIssue(issue: ValidationIssue): string {
	const { line, column } = issue.range.start
	const location = `${line + 1}:${column}`.padEnd(6)
	const severity = issue.severity.padEnd(7)
	const code = issue.code.padEnd(24)
	const colorFn = severityColors[issue.severity]

	return `  ${chalk.dim(location)} ${colorFn(severity)} ${chalk.cyan(code)} ${issue.message}`
}

/**
 * Format the summary line
 */
export function formatSummary(counts: Record<Severity, number>): string {
	const parts: string[] = []

	if (counts.critical > 0) {
		parts.push(chalk.red(`${counts.critical} critical`))
	}
	if (counts.warning > 0) {
		parts.push(
			chalk.yellow(`${counts.warning} warning${counts.warning > 1 ? 's' : ''}`),
		)
	}
	if (counts.note > 0) {
		parts.push(chalk.blue(`${counts.note} note${counts.note > 1 ? 's' : ''}`))
	}
	if (counts.bonus > 0) {
		parts.push(chalk.gray(`${counts.bonus} bonus`))
	}

	if (parts.length === 0) {
		return chalk.green('No issues found')
	}

	return parts.join(', ')
}

/**
 * Run validation on raw content and return structured results.
 *
 * This is the core check logic used by both `--check` (validate-only)
 * and the default validate-then-render flow.
 */
export async function runCheck(
	rawContent: string,
	options: CheckOptions = {},
): Promise<CheckResult> {
	const result = await validate(rawContent, {
		extends: options.validateConfig?.extends,
		rules: options.validateConfig?.rules,
	})

	// Filter issues by minimum severity
	const minSeverity = options.minSeverity ?? 'bonus'
	const minSeverityLevel = severityOrder[minSeverity]
	const filteredIssues = result.issues.filter(
		issue => severityOrder[issue.severity] <= minSeverityLevel,
	)

	// Determine whether rendering should proceed
	let ok: boolean
	if (options.strict) {
		ok = filteredIssues.length === 0
	} else {
		ok = result.counts.critical === 0
	}

	return { result, filteredIssues, ok }
}

/**
 * Print validation issues and summary to stdout.
 */
export function printCheckResults(
	filteredIssues: ValidationIssue[],
	label: string,
): void {
	if (filteredIssues.length > 0) {
		console.log(chalk.underline(label))
		for (const issue of filteredIssues) {
			console.log(formatIssue(issue))
		}
		console.log()
	}

	const displayedCounts: Record<Severity, number> = {
		critical: filteredIssues.filter(i => i.severity === 'critical').length,
		warning: filteredIssues.filter(i => i.severity === 'warning').length,
		note: filteredIssues.filter(i => i.severity === 'note').length,
		bonus: filteredIssues.filter(i => i.severity === 'bonus').length,
	}
	console.log(formatSummary(displayedCounts))
}
