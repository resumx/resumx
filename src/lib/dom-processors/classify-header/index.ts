/**
 * Classify Header Processor
 *
 * Handles all header transformations:
 * 1. Wraps contact information in <address> elements
 * 2. Adds data-field attributes for JSON Resume compatibility
 *
 * This enables:
 * - CSS selectors like [data-field="email"] for styling
 * - JSON Resume export by extracting marked elements
 */

import type { PipelineContext } from '../types.js'
import { withDOM } from '../shared/dom.js'
import { isLocation } from '../shared/location.js'

import { wrapContactBlocks } from './wrap-address.js'
import { classifyLink } from './classify-links.js'

// Re-export for test compatibility
export { isContactBlock } from './contact-block.js'

// =============================================================================
// Constants
// =============================================================================

/** NodeFilter.SHOW_TEXT constant (value = 4) */
const SHOW_TEXT = 4

// =============================================================================
// DOM Helpers
// =============================================================================

/**
 * Collect all text nodes from an element using TreeWalker.
 */
function collectTextNodes(container: Element, document: Document): Text[] {
	const walker = document.createTreeWalker(container, SHOW_TEXT, null)
	const nodes: Text[] = []
	let node: Text | null
	while ((node = walker.nextNode() as Text | null)) {
		nodes.push(node)
	}
	return nodes
}

/**
 * Create a DocumentFragment containing a field-wrapped span with preserved
 * surrounding whitespace from the raw text.
 *
 * This is the shared primitive used by both location and summary classification.
 */
function createFieldSpan(
	rawText: string,
	fieldName: string,
	document: Document,
): DocumentFragment {
	const leadingWs = rawText.match(/^\s*/)?.[0] || ''
	const trailingWs = rawText.match(/\s*$/)?.[0] || ''
	const trimmed = rawText.trim()

	const fragment = document.createDocumentFragment()

	if (leadingWs) fragment.appendChild(document.createTextNode(leadingWs))

	const span = document.createElement('span')
	span.setAttribute('data-field', fieldName)
	span.textContent = trimmed
	fragment.appendChild(span)

	if (trailingWs) fragment.appendChild(document.createTextNode(trailingWs))

	return fragment
}

// =============================================================================
// Field Classification
// =============================================================================

/**
 * Check if text looks like a separator (just punctuation/whitespace)
 */
function isSeparator(text: string): boolean {
	return /^[\s|•·,\-–—]+$/.test(text)
}

/**
 * Find and mark summary text in the header.
 *
 * Summary text is any substantial text in the header that isn't:
 * - The name (h1)
 * - Contact info (email, phone, location, profiles, url)
 * - Just separators or whitespace
 */
function classifySummaryInHeader(header: Element, document: Document): void {
	// Check for elements outside address that could be summary
	for (const child of Array.from(header.children)) {
		const tag = child.tagName.toLowerCase()

		// Skip h1 (name) and address (contact)
		if (tag === 'h1' || tag === 'address') continue

		// Skip if already classified
		if (child.hasAttribute('data-field')) continue

		// If it's a block element with substantial text, mark as summary
		const text = child.textContent?.trim() || ''
		if (text.length > 10 && !isSeparator(text)) {
			child.setAttribute('data-field', 'summary')
		}
	}

	// Also check for unclassified text inside address
	const address = header.querySelector('address')
	if (!address) return

	const textNodes = collectTextNodes(address, document)

	for (const textNode of textNodes) {
		const text = textNode.textContent || ''
		const trimmed = text.trim()

		// Skip empty, separators, or short text
		if (!trimmed || isSeparator(trimmed) || trimmed.length <= 10) continue

		// Skip if parent already has data-field
		const parent = textNode.parentElement
		if (parent?.hasAttribute('data-field')) continue

		// This looks like summary text - wrap it
		textNode.replaceWith(createFieldSpan(text, 'summary', document))
	}
}

/**
 * Find and mark location text within an address element.
 *
 * Strategy:
 * 1. Get text content excluding already-classified elements
 * 2. Split by separators (|, •, ·, newlines)
 * 3. Check each segment against city database
 * 4. Wrap matching segments in <span data-field="location">
 */
function classifyLocationInAddress(address: Element, document: Document): void {
	const textNodes = collectTextNodes(address, document)

	for (const textNode of textNodes) {
		const text = textNode.textContent || ''

		// Skip if parent already has data-field (e.g., inside a link)
		const parent = textNode.parentElement
		if (parent?.hasAttribute('data-field')) continue

		// Split by common separators
		const segments = text.split(/([|•·]|\s{2,})/)

		// Check if any segment is a location
		let hasLocation = false
		const parts: Array<{ isLocation: boolean; text: string }> = []

		for (const segment of segments) {
			const trimmed = segment.trim()
			if (isLocation(trimmed)) {
				hasLocation = true
				parts.push({ isLocation: true, text: segment })
			} else {
				parts.push({ isLocation: false, text: segment })
			}
		}

		// If we found a location, reconstruct with wrapped spans
		if (!hasLocation || !parent) continue

		const fragment = document.createDocumentFragment()

		for (const part of parts) {
			if (!part.isLocation || !part.text.trim()) {
				fragment.appendChild(document.createTextNode(part.text))
				continue
			}

			fragment.appendChild(createFieldSpan(part.text, 'location', document))
		}

		textNode.replaceWith(fragment)
	}
}

// =============================================================================
// Main Processor
// =============================================================================

/**
 * Classify header elements for JSON Resume compatibility.
 *
 * This processor handles all header transformations:
 * 1. Wraps contact blocks in <address> elements
 * 2. Adds data-field attributes for name, email, phone, location, profiles, url
 *
 * @param html - Input HTML string
 * @param _ctx - Pipeline context (unused by this processor)
 * @returns HTML with header elements classified
 */
export function classifyHeader(html: string, _ctx: PipelineContext): string {
	if (!html.trim()) return html

	return withDOM(html, (root, document) => {
		// Step 1: Wrap contact blocks in <address> elements
		wrapContactBlocks(root, document)

		// Step 2: Classify header fields
		const header = root.querySelector('header')
		if (!header) return

		// Mark h1 as name
		const h1 = header.querySelector('h1')
		if (h1) {
			h1.setAttribute('data-field', 'name')
		}

		// Find address element (contains contact links)
		const address = header.querySelector('address')
		if (!address) return

		// Process all links in address
		const links = Array.from(address.querySelectorAll('a'))
		for (const link of links) {
			classifyLink(link)
		}

		// Classify location text in address (after links are processed)
		classifyLocationInAddress(address, document)

		// Mark remaining unclassified text as summary
		classifySummaryInHeader(header, document)
	})
}
