/**
 * Wrap Sections Processor
 *
 * Wraps each h2 element and its following content in a <section> tag
 * with a slugified ID based on the section title.
 *
 * Behavior:
 * - Stops grouping at next <h2> OR <hr> (independent of processColumns order)
 * - Skips h2s inside <header> element
 * - Applies to root and column containers (.primary, .secondary)
 */

import { parseHTML } from 'linkedom'
import type { PipelineContext } from '../types.js'
import { collectSiblings } from '../shared/dom.js'

/**
 * Convert text to URL-friendly slug
 * "Work Experience" -> "work-experience"
 * "Technical Skills & Tools" -> "technical-skills-and-tools"
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/&/g, 'and') // Convert & to 'and'
		.replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Remove consecutive hyphens
		.replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Wrap h2 sections within a container element
 * Mutates the container in place
 */
function wrapSectionsInContainer(container: Element, document: Document): void {
	// Find all direct h2 children (not nested inside other elements)
	const h2s = Array.from(container.querySelectorAll(':scope > h2'))

	if (h2s.length === 0) {
		return
	}

	// Process each h2
	for (const h2 of h2s) {
		// Create section element
		const section = document.createElement('section')
		const sectionId = slugify(h2.textContent || '')
		if (sectionId) {
			section.setAttribute('id', sectionId)
		}

		// Collect elements: h2 + siblings until next h2 or hr
		const elementsToWrap = collectSiblings(
			h2,
			el => el.tagName === 'H2' || el.tagName === 'HR',
		)

		// Insert section before the h2
		h2.parentElement?.insertBefore(section, h2)

		// Move elements into section
		for (const el of elementsToWrap) {
			section.appendChild(el)
		}
	}
}

/**
 * Wrap h2 groups in <section> tags with slugified IDs
 *
 * @param html - Input HTML string
 * @param _ctx - Pipeline context (unused by this processor)
 * @returns HTML with sections wrapped
 */
export function wrapSections(html: string, _ctx: PipelineContext): string {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!

	// Process root level (for single-column layout)
	// But skip if content is inside two-column-layout (we'll process columns instead)
	const twoColumnLayout = root.querySelector('.two-column-layout')

	if (twoColumnLayout) {
		// Process inside each column
		const primary = twoColumnLayout.querySelector('.primary')
		const secondary = twoColumnLayout.querySelector('.secondary')

		if (primary) {
			wrapSectionsInContainer(primary, document)
		}
		if (secondary) {
			wrapSectionsInContainer(secondary, document)
		}
	} else {
		// Single column: process root directly, but skip header
		// We need to be careful not to wrap h2s that are inside header
		// Since we use :scope > h2, we only get direct children anyway
		wrapSectionsInContainer(root, document)
	}

	return root.innerHTML
}
