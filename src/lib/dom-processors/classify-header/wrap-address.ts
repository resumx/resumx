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

/**
 * Merge multiple elements into a single <address> element.
 */
function mergeIntoAddress(
	elements: ClassifiedElement[],
	document: Document,
): Element {
	const address = document.createElement('address')

	// Copy attributes from first element
	copyAttributes(elements[0]!.el, address)

	// Move children with newline separators
	elements.forEach((item, i) => {
		if (i > 0) address.appendChild(document.createTextNode('\n'))
		while (item.el.firstChild) {
			address.appendChild(item.el.firstChild)
		}
	})

	return address
}

// =============================================================================
// Main
// =============================================================================

/**
 * Wrap contact blocks in <address> elements within the header.
 */
export function wrapContactBlocks(root: Element, document: Document): void {
	const candidates = getCandidateElements(root)
	const classified = candidates.map(el => ({ el, type: classifyElement(el) }))
	const runs = findContactRuns(classified)

	for (const run of runs) {
		const address = mergeIntoAddress(run, document)

		// Replace first element with merged address, remove the rest
		run[0]!.el.replaceWith(address)
		for (let i = 1; i < run.length; i++) {
			run[i]!.el.remove()
		}
	}
}
