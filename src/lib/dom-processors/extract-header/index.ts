/**
 * Extract Header Processor
 *
 * Extracts content before the first <h2> into a <header> element.
 * This separates the resume header (name, contact info) from sections.
 */

import type { PipelineContext } from '../types.js'
import { collectSiblings, serializeElements, withDOM } from '../shared/dom.js'

/**
 * Extract content before first h2 into a <header> element
 *
 * @param html - Input HTML string
 * @param _ctx - Pipeline context (unused by this processor)
 * @returns HTML with header extracted, or unchanged if no h2 or h2 is first
 */
export function extractHeader(html: string, _ctx: PipelineContext): string {
	return withDOM(html, root => {
		const firstH2 = root.querySelector('h2')

		// No h2 or h2 is first element: return unchanged
		if (!firstH2 || firstH2 === root.firstElementChild) {
			return html
		}

		// Extract header (content before first h2)
		const headerContent = collectSiblings(root.firstElementChild, firstH2)

		// Get rest of content (h2 and everything after)
		const restContent = collectSiblings(firstH2)

		return `<header>${serializeElements(headerContent)}</header>\n${serializeElements(restContent)}`
	})
}
