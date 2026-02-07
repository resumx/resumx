/**
 * Missing Contact Plugin
 *
 * Validates that the resume has contact information (email or phone) after the H1 heading.
 *
 * ## Checks
 *
 * | Code            | Severity | Description                                   |
 * |-----------------|----------|-----------------------------------------------|
 * | missing-contact | critical | No email or phone number after the H1 heading |
 *
 * ## Expected Structure
 *
 * ```markdown
 * # John Doe
 * > email@example.com       <- Contact info (required)
 * ```
 *
 * @module validator/plugins/structure/missing-contact
 */

import type Token from 'markdown-it/lib/token.mjs'
import type {
	ValidationContext,
	ValidationIssue,
	ValidatorPlugin,
} from '../../types.js'
import { rangeFromToken, rangeAtStart } from '../../utils.js'

/** Email regex pattern */
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/

/** Phone regex pattern - matches various formats with at least 7 digits */
const PHONE_PATTERN = /[\d\s\-().+]{7,}/

/**
 * Extract text content from an inline token's children
 */
function extractTextFromInline(token: Token): string {
	if (!token.children) return token.content || ''
	return token.children
		.filter(t => t.type === 'text' || t.type === 'code_inline')
		.map(t => t.content)
		.join('')
}

/**
 * Extract link hrefs from an inline token's children.
 * This catches cases like `[Contact Me](mailto:foo@bar.com)` where the
 * visible text doesn't match email/phone patterns but the href does.
 */
function extractLinkHrefs(token: Token): string[] {
	if (!token.children) return []
	return token.children
		.filter(t => t.type === 'link_open' && t.attrs)
		.flatMap(t => t.attrs ?? [])
		.filter(([key]) => key === 'href')
		.map(([, value]) => value)
}

/**
 * Check if content or link hrefs contain contact info (email, phone,
 * or mailto:/tel: links — mirroring the signals used by the DOM-level
 * contact-block classifier in `src/lib/dom-processors`).
 */
function hasContactInfo(content: string, linkHrefs: string[] = []): boolean {
	if (EMAIL_PATTERN.test(content) || PHONE_PATTERN.test(content)) return true

	// Check link hrefs for mailto: / tel: schemes
	return linkHrefs.some(
		href => href.startsWith('mailto:') || href.startsWith('tel:'),
	)
}

/**
 * Collect all text content and link hrefs between H1 and the next heading.
 *
 * Previous implementation only checked the *first* paragraph / blockquote
 * after H1. Resumes commonly have a job-title paragraph before the actual
 * contact lines, so we must scan everything up to the next heading.
 */
function collectHeaderContent(
	tokens: Token[],
	h1Index: number,
): { content: string; linkHrefs: string[] } {
	// Skip to heading_close
	let i = h1Index + 1
	while (i < tokens.length) {
		const currentToken = tokens[i]
		if (currentToken?.type === 'heading_close') break
		i++
	}
	i++ // Move past heading_close

	let content = ''
	const linkHrefs: string[] = []

	// Scan ALL paragraphs and blockquotes until the next heading
	while (i < tokens.length) {
		const token = tokens[i]
		if (!token) break

		// Stop at next heading — we've left the header area
		if (token.type === 'heading_open') break

		if (token.type === 'inline') {
			content += extractTextFromInline(token) + ' '
			linkHrefs.push(...extractLinkHrefs(token))
		}

		i++
	}

	return { content: content.trim(), linkHrefs }
}

/**
 * Missing Contact plugin - validates that resume has contact info after H1
 *
 * Checks:
 * - missing-contact (critical): No email or phone after H1
 */
export const missingContactPlugin: ValidatorPlugin = {
	name: 'missing-contact',

	validate(ctx: ValidationContext): ValidationIssue[] {
		const { tokens, lines } = ctx
		const issues: ValidationIssue[] = []

		let h1Index = -1
		let h1Token: Token | null = null

		// Find H1
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]
			if (!token) continue

			if (token.type === 'heading_open' && token.tag === 'h1') {
				h1Index = i
				h1Token = token
				break
			}
		}

		// Only check contact if H1 exists
		if (h1Index >= 0) {
			const { content, linkHrefs } = collectHeaderContent(tokens, h1Index)
			if (!content || !hasContactInfo(content, linkHrefs)) {
				issues.push({
					severity: 'critical',
					code: 'missing-contact',
					message: 'Resume must have contact info (email or phone) after name',
					range: h1Token ? rangeFromToken(h1Token, lines) : rangeAtStart(),
				})
			}
		}

		return issues
	},
}
