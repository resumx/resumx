import type { PipelineContext } from '../types.js'
import { withDOM } from '../../../lib/dom-kit/dom.js'

/** NodeFilter.SHOW_COMMENT — TreeWalker filter for Comment nodes (<!-- … -->) */
const SHOW_COMMENT = 0x80

export function stripComments(html: string, _ctx: PipelineContext): string {
	if (!html) return ''

	return withDOM(html, (root, document) => {
		const walker = document.createTreeWalker(root, SHOW_COMMENT)
		const comments: Node[] = []
		while (walker.nextNode()) {
			comments.push(walker.currentNode)
		}
		for (const node of comments) {
			node.parentNode?.removeChild(node)
		}
	})
}
