/**
 * DOM Processor Pipeline
 *
 * A unified system for structural HTML transformations.
 * Each processor receives HTML and a PipelineContext, returns modified HTML.
 *
 * Design:
 * - Processors are independent and composable
 * - Order matters: processors run in array order
 * - Context provides config (user settings) and env (derived values like CSS)
 */

import { filterByLang } from './filter-by-lang/index.js'
import { filterByRole } from './filter-by-role/index.js'
import { extractHeader } from './extract-header/index.js'
import { processColumns } from './process-columns/index.js'
import { wrapSections } from './wrap-sections/index.js'
import { classifySections } from './classify-sections/index.js'
import { classifyHeader } from './classify-header/index.js'
import { wrapEntries } from './wrap-entries/index.js'
import type { DOMProcessor, PipelineContext } from './types.js'

/**
 * Default processor pipeline
 * Order matters:
 * 1. filterByLang - remove non-matching language content (before role so role filtering operates on language-filtered content)
 * 2. filterByRole - remove non-matching role content
 * 3. extractHeader - pull content before first h2 into <header>
 * 4. wrapSections - wrap h2 groups in <section> tags (before columns so no layout awareness needed)
 * 5. wrapEntries - wrap h3 groups in <article class="entry"> tags (before columns so no layout awareness needed)
 * 6. processColumns - handle <hr>, create two-column layout (operates on already-wrapped sections)
 * 7. classifySections - add data-section attrs for JSON Resume types
 * 8. classifyHeader - wrap contact info in <address>, add data-field attrs
 */
export const defaultProcessors: DOMProcessor[] = [
	{ name: 'filterByLang', process: filterByLang },
	{ name: 'filterByRole', process: filterByRole },
	{ name: 'extractHeader', process: extractHeader },
	{ name: 'wrapSections', process: wrapSections },
	{ name: 'wrapEntries', process: wrapEntries },
	{ name: 'processColumns', process: processColumns },
	{ name: 'classifySections', process: classifySections },
	{ name: 'classifyHeader', process: classifyHeader },
]

/**
 * Run HTML through the processor pipeline
 */
export function runPipeline(
	html: string,
	ctx: PipelineContext,
	processors: DOMProcessor[] = defaultProcessors,
): string {
	return processors.reduce((h, processor) => processor.process(h, ctx), html)
}

// Re-export types
export type {
	DOMProcessor,
	PipelineContext,
	PipelineConfig,
	PipelineEnv,
} from './types.js'

// Re-export individual processors for testing
export { filterByLang } from './filter-by-lang/index.js'
export { filterByRole } from './filter-by-role/index.js'
export { extractHeader } from './extract-header/index.js'
export { processColumns } from './process-columns/index.js'
export { wrapSections, slugify } from './wrap-sections/index.js'
export { classifySections } from './classify-sections/index.js'
export { classifyHeader, isContactBlock } from './classify-header/index.js'
export { wrapEntries } from './wrap-entries/index.js'
