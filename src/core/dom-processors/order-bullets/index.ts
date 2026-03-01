import { withDOM } from '../../../lib/dom-kit/dom.js'
import { extractTagNames, resolveTagSet } from '../../target-composition.js'
import type { BulletOrder } from '../../view/types.js'

/**
 * Factory that returns an HtmlTransform reordering bullets by tag priority.
 *
 * - 'none': identity (document order preserved)
 * - 'tag': tagged bullets promoted to top and sorted by selects declaration
 *   order. Constituents inherit their composed tag's position.
 */
export function orderBullets(
	bulletOrder: BulletOrder,
	selects: string[] | null,
	tagMap?: Record<string, string[]>,
): (html: string) => string {
	if (bulletOrder === 'none' || !selects?.length) {
		return html => html
	}

	const priorityMap = buildPriorityMap(selects, tagMap ?? {})

	return html =>
		withDOM(html, root => {
			const uls = Array.from(root.querySelectorAll('ul'))
			for (const ul of uls) {
				const items = Array.from(ul.querySelectorAll(':scope > li'))
				if (items.length === 0) continue

				const tagged: { el: Element; priority: number; idx: number }[] = []
				const untagged: { el: Element; idx: number }[] = []

				for (let i = 0; i < items.length; i++) {
					const el = items[i]!
					const priority = bestTagPriority(
						el.getAttribute('class') ?? '',
						priorityMap,
					)
					if (priority >= 0) {
						tagged.push({ el, priority, idx: i })
					} else {
						untagged.push({ el, idx: i })
					}
				}

				if (tagged.length === 0) continue

				tagged.sort((a, b) => a.priority - b.priority || a.idx - b.idx)

				for (const { el } of tagged) ul.appendChild(el)
				for (const { el } of untagged) ul.appendChild(el)
			}
		})
}

/**
 * Build a map from every concrete tag name to its priority.
 * Each constituent gets a unique incrementing priority following the
 * selects declaration order. Tags that appear in multiple selects
 * keep their first (highest-priority) position.
 */
function buildPriorityMap(
	selects: string[],
	tagMap: Record<string, string[]>,
): Map<string, number> {
	const map = new Map<string, number>()
	let nextRank = 0
	for (const select of selects) {
		for (const tag of resolveTagSet(select, tagMap)) {
			if (!map.has(tag)) {
				map.set(tag, nextRank++)
			}
		}
	}
	return map
}

function bestTagPriority(
	className: string,
	priorityMap: Map<string, number>,
): number {
	let best = -1
	for (const tag of extractTagNames(className)) {
		const p = priorityMap.get(tag)
		if (p !== undefined && (best < 0 || p < best)) best = p
	}
	return best
}
