/**
 * Filter By Tag Processor
 *
 * Factory that returns an HtmlTransform filtering content by tag.
 * Elements with .@X where X does not match the active tag set are removed.
 * Elements without any .@* class are kept (common content).
 *
 * Uses programmatic DOM iteration (not CSS selectors) to correctly
 * distinguish hierarchical tags like @backend vs @backend/node.
 */

import { withDOM } from '../../../lib/dom-kit/dom.js'
import {
	extractTagNames,
	resolveTagSetWithLineage,
} from '../../target-composition.js'

export function filterByTag(
	selects: string[] | null,
	tagMap?: Record<string, string[]>,
	contentTags?: string[],
): (html: string) => string {
	return html => {
		if (!selects?.length) return html

		const activeTag = selects[0]!
		const tagSet = resolveTagSetWithLineage(
			activeTag,
			tagMap ?? {},
			contentTags ?? [],
		)

		return withDOM(html, root => {
			const elements = Array.from(root.querySelectorAll('[class*="@"]'))
			for (const el of elements) {
				const tags = extractTagNames(el.getAttribute('class') ?? '')
				if (tags.length > 0 && !tags.some(t => tagSet.has(t))) {
					el.remove()
				}
			}
		})
	}
}
