/**
 * Wrap Entries Processor
 *
 * Wraps each h3 element and its following content in an <article class="entry"> tag.
 * This groups resume entries (jobs, projects, awards) into discrete, styleable units.
 *
 * Behavior:
 * - Finds ALL h3s in the document (container-agnostic)
 * - Stops grouping at next <h3>, <h2>, or <hr>
 * - Skips h3s inside <header> element
 * - Runs before processColumns so no column layout awareness needed
 */

import type { PipelineContext } from '../types.js'
import { collectSiblings, withDOM } from '../shared/dom.js'

/**
 * Wrap pre-found h3 entries within a container element.
 * Mutates the container in place.
 *
 * Creates structure:
 *   <div class="entries">
 *     <article class="entry">...</article>
 *     <article class="entry">...</article>
 *   </div>
 */
function wrapEntriesInContainer(
	container: Element,
	h3s: Element[],
	document: Document,
): void {
	if (h3s.length === 0) {
		return
	}

	// Create entries wrapper and insert before first h3
	const entriesDiv = document.createElement('div')
	entriesDiv.setAttribute('class', 'entries')
	container.insertBefore(entriesDiv, h3s[0]!)

	// Process each h3
	for (const h3 of h3s) {
		// Create article element
		const article = document.createElement('article')
		article.setAttribute('class', 'entry')

		// Collect elements: h3 + siblings until next h3, h2, or hr
		const elementsToWrap = collectSiblings(
			h3,
			el => el.tagName === 'H3' || el.tagName === 'H2' || el.tagName === 'HR',
		)

		// Move elements into article
		for (const el of elementsToWrap) {
			article.appendChild(el)
		}

		// Append article to entries container
		entriesDiv.appendChild(article)
	}
}

/**
 * Wrap h3 groups in <article class="entry"> tags
 *
 * Finds all h3 elements in the document (excluding those inside <header>),
 * groups them by parent element, and wraps each group.
 *
 * @param html - Input HTML string
 * @param _ctx - Pipeline context (unused by this processor)
 * @returns HTML with entries wrapped
 */
export function wrapEntries(html: string, _ctx: PipelineContext): string {
	return withDOM(html, (root, document) => {
		// Find ALL h3s, excluding those inside <header>
		const allH3s = Array.from(root.querySelectorAll('h3')).filter(
			h3 => !h3.closest('header'),
		)

		if (allH3s.length === 0) return

		// Group h3s by parent element
		const byParent = new Map<Element, Element[]>()
		for (const h3 of allH3s) {
			const parent = h3.parentElement!
			if (!byParent.has(parent)) byParent.set(parent, [])
			byParent.get(parent)!.push(h3)
		}

		// Wrap entries in each container
		for (const [parent, h3s] of byParent) {
			wrapEntriesInContainer(parent, h3s, document)
		}
	})
}
