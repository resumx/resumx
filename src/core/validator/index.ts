import { createMarkdownRenderer } from '../markdown.js'
import type {
	ValidationContext,
	ValidationIssue,
	ValidationResult,
	ValidatorOptions,
	ValidatorPlugin,
	PresetName,
	Severity,
} from './types.js'

/**
 * Strip YAML/TOML frontmatter from raw content so markdown-it doesn't
 * misinterpret YAML comments (e.g. `# comment`) as ATX headings.
 *
 * Returns the body without frontmatter and the number of lines consumed
 * by the frontmatter block (used to adjust issue line numbers back to
 * original file positions).
 */
function stripFrontmatter(raw: string): { body: string; lineOffset: number } {
	const match = raw.match(/^(---|\+\+\+)\r?\n[\s\S]*?\r?\n\1[ \t]*(?:\r?\n|$)/)
	if (!match) return { body: raw, lineOffset: 0 }

	const fm = match[0]
	const lineOffset = fm.split('\n').length - (fm.endsWith('\n') ? 1 : 0)
	return { body: raw.slice(fm.length), lineOffset }
}

// Built-in plugins
import {
	missingNamePlugin,
	missingContactPlugin,
	noSectionsPlugin,
	noEntriesPlugin,
	emptyBulletPlugin,
	longBulletPlugin,
	singleBulletSectionPlugin,
	unknownFencedDivTagPlugin,
	nonPtFontSizePlugin,
	spacedBracketedSpanPlugin,
} from './plugins/index.js'

/** Named presets - plugin collections */
export const presets: Record<PresetName, ValidatorPlugin[]> = {
	recommended: [
		missingNamePlugin,
		missingContactPlugin,
		noSectionsPlugin,
		noEntriesPlugin,
		emptyBulletPlugin,
		longBulletPlugin,
		singleBulletSectionPlugin,
		unknownFencedDivTagPlugin,
		nonPtFontSizePlugin,
		spacedBracketedSpanPlugin,
	],
	minimal: [
		missingNamePlugin,
		missingContactPlugin,
		noSectionsPlugin,
		noEntriesPlugin,
		emptyBulletPlugin,
		unknownFencedDivTagPlugin,
		nonPtFontSizePlugin,
		spacedBracketedSpanPlugin,
	],
	strict: [
		missingNamePlugin,
		missingContactPlugin,
		noSectionsPlugin,
		noEntriesPlugin,
		emptyBulletPlugin,
		longBulletPlugin,
		singleBulletSectionPlugin,
		unknownFencedDivTagPlugin,
		nonPtFontSizePlugin,
		spacedBracketedSpanPlugin,
	],
	none: [],
}

/** Resolve which plugins to run based on extends + plugins options */
function resolvePlugins(options: ValidatorOptions): ValidatorPlugin[] {
	const { extends: ext = 'recommended', plugins: customPlugins = [] } = options
	const base = presets[ext]
	return [...base, ...customPlugins]
}

/** Severity order for sorting (critical first) */
const severityOrder: Record<Severity, number> = {
	critical: 0,
	warning: 1,
	note: 2,
	bonus: 3,
}

/**
 * Run validation with plugins
 *
 * @param content - Markdown content to validate
 * @param options - Validator options (preset, plugins, rules)
 * @returns Validation result with issues and counts
 */
export async function validate(
	content: string,
	options: ValidatorOptions = {},
): Promise<ValidationResult> {
	const { body, lineOffset } = stripFrontmatter(content)
	const md = createMarkdownRenderer()
	const tokens = md.parse(body, {})
	const lines = body.split('\n')

	const ctx: ValidationContext = { content, tokens, lines }
	const rules = options.rules ?? {}
	const plugins = resolvePlugins(options)

	// Run all plugins and collect issues
	const allIssues: ValidationIssue[] = []

	for (const plugin of plugins) {
		const issues = await plugin.validate(ctx)

		// Apply rule overrides
		for (const issue of issues) {
			const override = rules[issue.code]
			if (override === 'off') continue // Skip disabled rules
			if (override) issue.severity = override // Override severity
			allIssues.push(issue)
		}
	}

	// Adjust line numbers back to original file positions
	if (lineOffset > 0) {
		for (const issue of allIssues) {
			issue.range.start.line += lineOffset
			issue.range.end.line += lineOffset
		}
	}

	// Sort by severity (critical first) then by line number
	allIssues.sort((a, b) => {
		const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
		if (severityDiff !== 0) return severityDiff
		return a.range.start.line - b.range.start.line
	})

	return {
		valid: allIssues.filter(i => i.severity === 'critical').length === 0,
		issues: allIssues,
		counts: {
			critical: allIssues.filter(i => i.severity === 'critical').length,
			warning: allIssues.filter(i => i.severity === 'warning').length,
			note: allIssues.filter(i => i.severity === 'note').length,
			bonus: allIssues.filter(i => i.severity === 'bonus').length,
		},
	}
}

// Re-export types, utils, and plugins for extensibility
export * from './types.js'
export * from './utils.js'

// Re-export all plugins
export {
	missingNamePlugin,
	missingContactPlugin,
	noSectionsPlugin,
	noEntriesPlugin,
	emptyBulletPlugin,
	createLongBulletPlugin,
	longBulletPlugin,
	singleBulletSectionPlugin,
	unknownFencedDivTagPlugin,
	nonPtFontSizePlugin,
	spacedBracketedSpanPlugin,
	type LongBulletOptions,
} from './plugins/index.js'
