/**
 * Wrap Entries Processor
 *
 * Wraps each h3 element and its following content in an <article class="entry"> tag.
 * This groups resume entries (jobs, projects, awards) into discrete, styleable units.
 *
 * Behavior:
 * - Stops grouping at next <h3>, <h2>, or <hr>
 * - Skips h3s inside <header> element
 * - Applies to root, sections, and column containers (.primary, .secondary)
 */

import { parseHTML } from 'linkedom'
import type { PipelineContext } from '../types.js'
import { collectSiblings } from '../shared/dom.js'

/**
 * Wrap h3 entries within a container element
 * Mutates the container in place
 *
 * Creates structure:
 *   <div class="entries">
 *     <article class="entry">...</article>
 *     <article class="entry">...</article>
 *   </div>
 */
function wrapEntriesInContainer(container: Element, document: Document): void {
	// Find all direct h3 children (not nested inside other elements)
	const h3s = Array.from(container.querySelectorAll(':scope > h3'))

	if (h3s.length === 0) {
		return
	}

	// Create entries wrapper and insert before first h3
	const entriesDiv = document.createElement('div')
	entriesDiv.setAttribute('class', 'entries')
	const firstH3 = h3s[0]!
	container.insertBefore(entriesDiv, firstH3)

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
 * Recursively process all sections within a container
 */
function processContainer(container: Element, document: Document): void {
	// First, process h3s directly in this container
	wrapEntriesInContainer(container, document)

	// Then, recursively process any section elements
	const sections = Array.from(container.querySelectorAll(':scope > section'))
	for (const section of sections) {
		wrapEntriesInContainer(section, document)
	}
}

/**
 * Wrap h3 groups in <article class="entry"> tags
 *
 * @param html - Input HTML string
 * @param _ctx - Pipeline context (unused by this processor)
 * @returns HTML with entries wrapped
 */
export function wrapEntries(html: string, _ctx: PipelineContext): string {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!

	// Check for two-column layout
	const twoColumnLayout = root.querySelector('.two-column-layout')

	if (twoColumnLayout) {
		// Process inside each column
		const primary = twoColumnLayout.querySelector('.primary')
		const secondary = twoColumnLayout.querySelector('.secondary')

		if (primary) {
			processContainer(primary, document)
		}
		if (secondary) {
			processContainer(secondary, document)
		}
	} else {
		// Single column: process root directly
		processContainer(root, document)
	}

	return root.innerHTML
}
