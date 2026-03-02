/**
 * DOM Processor Pipeline
 *
 * Assembles a chain of HTML transformations from DocumentContext and ResolvedView.
 * Each processor is either a pure (html) => string function or a factory that
 * closes over its configuration and returns one.
 */

import { stripComments } from './strip-comments/index.js'
import { filterByLang } from './filter-by-lang/index.js'
import { filterByTag } from './filter-by-tag/index.js'
import { orderBullets } from './order-bullets/index.js'
import { extractHeader } from './extract-header/index.js'
import { wrapSections } from './wrap-sections/index.js'
import { classifySections } from './classify-sections/index.js'
import { arrangeSections } from './filter-by-layout/index.js'
import { classifyHeader } from './classify-header/index.js'
import { wrapEntries } from './wrap-entries/index.js'
import type { ResolvedView } from '../view/types.js'
import type { DocumentContext } from '../types.js'

/**
 * Assemble the DOM processor pipeline from view and document config.
 *
 * Order matters:
 * 1. stripComments - remove HTML comment nodes
 * 2. filterByLang - remove non-matching language content
 * 3. filterByTag - remove non-matching tag content
 * 4. orderBullets - reorder bullets by tag priority (after tag classes are set)
 * 5. extractHeader - pull content before first h2 into <header>
 * 6. wrapSections - wrap h2 groups in <section> tags
 * 7. wrapEntries - wrap h3 groups in <article class="entry"> tags
 * 8. classifySections - add data-section attrs for JSON Resume types
 * 9. arrangeSections - hide sections and pin others to the top
 * 10. classifyHeader - wrap contact info in <address>, add data-field attrs
 */
export function assemblePipeline(
	view: ResolvedView,
	doc: DocumentContext,
): HtmlTransform {
	const steps: HtmlTransform[] = [
		stripComments,
		filterByLang(view.lang),
		filterByTag(view.selects, doc.tagMap, doc.contentTags),
		orderBullets(view.bulletOrder, view.selects, doc.tagMap, doc.contentTags),
		extractHeader,
		wrapSections,
		wrapEntries,
		classifySections,
		arrangeSections(view.sections),
		classifyHeader,
	]
	return html => steps.reduce((h, step) => step(h), html)
}

export type HtmlTransform = (html: string) => string

export { filterByLang } from './filter-by-lang/index.js'
export { filterByTag } from './filter-by-tag/index.js'
export { extractHeader } from './extract-header/index.js'
export { wrapSections, slugify } from './wrap-sections/index.js'
export { classifySections } from './classify-sections/index.js'
export { classifyHeader, isContactBlock } from './classify-header/index.js'
export { wrapEntries } from './wrap-entries/index.js'
export { arrangeSections } from './filter-by-layout/index.js'
export { orderBullets } from './order-bullets/index.js'
export { stripComments } from './strip-comments/index.js'
