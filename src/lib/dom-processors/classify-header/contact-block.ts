/**
 * Contact Block Detection
 *
 * Handles detection of contact information blocks for wrapping in <address>.
 */

import { isLocation } from '../shared/location.js'
import { SOCIAL_DOMAINS, isSocialDomain } from './social.js'

// =============================================================================
// Contact Detection Patterns
// =============================================================================

/**
 * Pattern matchers for contact-type segments
 */
const CONTACT_PATTERNS = {
	// Email: anything@something.tld
	email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,

	// Phone: 7+ chars with digits, may include +, -, (), spaces
	phone: /^[\d\s\-+().]{7,}$/,
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if a segment looks like a URL (without being a social domain)
 *
 * @example
 * isGenericUrl("https://example.com")   // true
 * isGenericUrl("http://my-site.org")    // true
 * isGenericUrl("example.com/portfolio") // true  (matches `.com/`)
 * isGenericUrl("example.com")           // false (no trailing slash/path)
 * isGenericUrl("hello world")           // false
 */
function isGenericUrl(segment: string): boolean {
	return /^https?:\/\//.test(segment) || /\.\w{2,}\//.test(segment)
}

/**
 * Check if a segment looks like prose (has substantial non-contact text)
 *
 * Threshold is 7+ words to avoid false positives on job titles like:
 * - "Senior Software Developer" (3 words)
 * - "Full Stack Software Engineer" (4 words)
 * - "Senior Staff Software Engineer Lead" (5 words)
 *
 * Note: contact tokens (emails, URLs) still count as words here, so the
 * threshold is set high enough that a typical title + one contact token
 * (e.g. 5 title words + 1 email = 6) won't trigger a false positive.
 */
function isProse(segment: string): boolean {
	return segment.split(/\s+/).filter(w => w.length > 2).length > 6
}

const enum SegmentKind {
	CONTACT = 1,
	CONTENT = -1,
	EMPTY = 0,
}

/**
 * Classify a single segment as contact or content
 */
function classifySegment(segment: string): SegmentKind {
	const trimmed = segment.trim()
	if (!trimmed) return SegmentKind.EMPTY

	// Prose is always content, even if it has contact info embedded
	if (isProse(trimmed)) return SegmentKind.CONTENT

	const isContact =
		CONTACT_PATTERNS.email.test(trimmed)
		|| CONTACT_PATTERNS.phone.test(trimmed)
		|| isLocation(trimmed)
		|| isSocialDomain(trimmed)
		// Weak signal: short link text (single word, likely username/handle)
		|| (isGenericUrl(trimmed) && !trimmed.includes(' '))

	return isContact ? SegmentKind.CONTACT : SegmentKind.CONTENT
}

/**
 * Count `<a>` elements whose `href` points to a contact destination
 * (mailto:, tel:, or a known social domain) vs all other links.
 *
 * This complements text-based classification: a link may display "John Doe"
 * but its href reveals `mailto:john@example.com`.
 */
function countContactLinks(element: Element): {
	contact: number
	other: number
} {
	const links = element.querySelectorAll('a')
	let contact = 0
	let other = 0

	for (const link of Array.from(links)) {
		const href = link.getAttribute('href') || ''
		const isContact =
			href.startsWith('mailto:')
			|| href.startsWith('tel:')
			|| SOCIAL_DOMAINS.some(d => href.toLowerCase().includes(d))

		if (isContact) {
			contact++
		} else {
			other++
		}
	}

	return { contact, other }
}

// =============================================================================
// Main Detection Function
// =============================================================================

/**
 * Check if an element contains contact information using segment density
 *
 * Strategy:
 * 1. Analyze links: mailto/tel/social domains are contact links
 * 2. Split remaining text by separators and classify
 * 3. If contact signals >= content signals, it's contact info
 */
export function isContactBlock(element: Element): boolean {
	const text = element.textContent || ''
	const html = element.innerHTML

	// Must have at least one contact signal in the HTML
	const hasContactSignal =
		html.includes('mailto:')
		|| html.includes('tel:')
		|| SOCIAL_DOMAINS.some(d => html.toLowerCase().includes(d))

	if (!hasContactSignal) return false

	// Prose is never a contact block
	if (isProse(text)) return false

	// Start score from link analysis (contact links +1, other links −1)
	const linkAnalysis = countContactLinks(element)
	let score = linkAnalysis.contact - linkAnalysis.other

	// Strip links, then classify the remaining text segments
	const clone = element.cloneNode(true) as Element
	clone.querySelectorAll('a').forEach(a => a.remove())
	const nonLinkText = clone.textContent || ''

	const segments = nonLinkText
		.split(/[|•·]|\s{2,}|\n/)
		.map(s => s.trim())
		.filter(s => s.length > 1)

	for (const segment of segments) {
		score += classifySegment(segment)
	}

	return score >= 0
}
