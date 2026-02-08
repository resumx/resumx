/**
 * Address Wrapping
 *
 * Wraps runs of consecutive contact/location elements in <address> tags.
 *
 * Strategy:
 * 1. Classify each candidate as CONTACT, LOCATION_ONLY, or OTHER
 * 2. Find runs of consecutive CONTACT/LOCATION_ONLY elements
 * 3. Merge each run into a single <address> element
 */

import { collectSiblings } from '../shared/dom.js'
import { isLocationOnly } from '../shared/location.js'
import { isContactBlock } from './contact-block.js'

// =============================================================================
// Types
// =============================================================================

type Classification = 'contact' | 'location' | 'other' | 'address'

type ClassifiedElement = { el: Element; type: Classification }

// =============================================================================
// Helpers
// =============================================================================

/**
 * Copy all attributes from source to target element.
 */
function copyAttributes(source: Element, target: Element): void {
	for (const attr of Array.from(source.attributes)) {
		target.setAttribute(attr.name, attr.value)
	}
}

/**
 * Get candidate elements for address wrapping from header or pre-header area.
 */
function getCandidateElements(root: Element): Element[] {
	const header = root.querySelector('header')
	const notH1 = (el: Element) => el.tagName.toLowerCase() !== 'h1'

	if (header) {
		// Scan direct children of header (excluding h1)
		return Array.from(header.children).filter(notH1)
	}

	// No header yet - scan elements before first h2 (excluding h1)
	return collectSiblings(
		root.firstElementChild,
		root.querySelector('h2'),
		notH1,
	)
}

/**
 * Classify an element as contact, location, other, or address.
 */
function classifyElement(el: Element): Classification {
	const tag = el.tagName.toLowerCase()
	if (tag === 'address') return 'address'
	if (isContactBlock(el)) return 'contact'
	if (isLocationOnly(el)) return 'location'
	return 'other'
}

/**
 * Find runs of consecutive contact/location elements.
 * A run must contain at least one 'contact' element to be valid.
 */
function findContactRuns(
	classified: ClassifiedElement[],
): ClassifiedElement[][] {
	const runs: ClassifiedElement[][] = []
	let currentRun: ClassifiedElement[] = []

	for (const item of classified) {
		if (item.type === 'contact' || item.type === 'location') {
			currentRun.push(item)
		} else {
			if (currentRun.some(i => i.type === 'contact')) {
				runs.push(currentRun)
			}
			currentRun = []
		}
	}

	// Don't forget trailing run
	if (currentRun.some(i => i.type === 'contact')) {
		runs.push(currentRun)
	}

	return runs
}

// =============================================================================
// Main
// =============================================================================

/**
 * Wrap contact blocks in <address> elements within the header.
 *
 * Single element: replaces the wrapper (e.g. <p> → <address>), lifting
 * attributes and children into the new <address>.
 *
 * Multiple elements: preserves each element's block structure (e.g. <p> tags)
 * inside the <address>, respecting the user's intentional paragraph breaks.
 */
export function wrapContactBlocks(root: Element, document: Document): void {
	const candidates = getCandidateElements(root)
	const classified = candidates.map(el => ({ el, type: classifyElement(el) }))
	const runs = findContactRuns(classified)

	for (const run of runs) {
		const address = document.createElement('address')
		const firstEl = run[0]!.el

		if (run.length === 1) {
			// Single element: replace wrapper (e.g. p → address)
			copyAttributes(firstEl, address)
			while (firstEl.firstChild) {
				address.appendChild(firstEl.firstChild)
			}
			firstEl.replaceWith(address)
		} else {
			// Multiple elements: preserve block structure inside <address>
			firstEl.before(address)
			for (const item of run) {
				address.appendChild(item.el)
			}
		}
	}
}
