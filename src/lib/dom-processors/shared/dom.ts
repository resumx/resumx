/**
 * Shared DOM Utilities
 *
 * Reusable functions for common DOM traversal patterns across processors.
 */

/**
 * Collect sibling elements in a range [start, until).
 *
 * Walks from `start` (inclusive) through `nextElementSibling` until:
 * - `until` element is reached (exclusive), or
 * - `until` predicate returns true on a *subsequent* element (exclusive), or
 * - there are no more siblings
 *
 * When `until` is a predicate, the start element is never checked against it.
 * This reflects the semantic difference: an element ref means "stop before THIS
 * specific node" (identity), while a predicate means "stop before the NEXT node
 * matching this description" (pattern).
 *
 * @param start - First element to consider (inclusive). If null, returns [].
 * @param until - Stop condition: element (stop before it), predicate (stop when true
 *                on elements after start), null/undefined (collect all remaining siblings).
 * @param filter - Optional predicate. Only elements where filter returns true are included.
 */
export function collectSiblings(
	start: Element | null,
	until?: Element | null | ((el: Element) => boolean),
	filter?: (el: Element) => boolean,
): Element[] {
	const results: Element[] = []
	let current = start
	let isFirst = true

	while (current) {
		// Check stop condition
		if (typeof until === 'function') {
			// Predicate: skip check on first element
			if (!isFirst && until(current)) break
		} else if (until != null) {
			// Element ref: always check (including first)
			if (current === until) break
		}

		// Apply filter
		if (!filter || filter(current)) {
			results.push(current)
		}

		isFirst = false
		current = current.nextElementSibling
	}

	return results
}
