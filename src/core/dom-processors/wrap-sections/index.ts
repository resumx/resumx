/**
 * Wrap Sections Processor
 *
 * Wraps each h2 element and its following content in a <section> tag
 * with a slugified ID based on the section title.
 *
 * Behavior:
 * - Stops grouping at next <h2> OR <hr>
 * - Skips h2s inside <header> element
 * - Runs before classifySections so sections are wrapped first
 */

import type { PipelineContext } from '../types.js'
import { collectSiblings, withDOM } from '../../../lib/dom-kit/dom.js'
import { slugify } from '../../../lib/dom-kit/slugify.js'

export { slugify }

/**
 * Wrap h2 groups in <section> tags with slugified IDs
 *
 * @param html - Input HTML string
 * @param _ctx - Pipeline context (unused by this processor)
 * @returns HTML with sections wrapped
 */
export function wrapSections(html: string, _ctx: PipelineContext): string {
	return withDOM(html, (root, document) => {
		// Find all direct h2 children (not nested inside other elements)
		const h2s = Array.from(root.querySelectorAll(':scope > h2'))

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
	})
}
