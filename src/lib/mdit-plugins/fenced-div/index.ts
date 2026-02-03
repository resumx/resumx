import type MarkdownIt from 'markdown-it'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'

interface ParsedAttributes {
	classes: string[]
	id: string | null
	attrs: Record<string, string>
}

/**
 * Parse {.class1 .class2 #id attr="value"} attribute string
 */
function parseAttributes(attrString: string): ParsedAttributes {
	const result: ParsedAttributes = {
		classes: [],
		id: null,
		attrs: {},
	}

	if (!attrString) return result

	// Remove surrounding braces
	const content = attrString.slice(1, -1).trim()
	if (!content) return result

	// Extract classes (.class-name or .class:name)
	const classPattern = /\.([^\s.#=]+)/g
	let match
	while ((match = classPattern.exec(content)) !== null) {
		const className = match[1]
		if (className) {
			result.classes.push(className)
		}
	}

	// Extract id
	const idPattern = /#([^\s.#=]+)/
	const idMatch = content.match(idPattern)
	if (idMatch?.[1]) {
		result.id = idMatch[1]
	}

	// Extract other attributes (attr="value" or attr='value' or attr=value)
	const attrPattern = /([a-zA-Z][\w-]*)=["']?([^"'\s]*)["']?/g
	while ((match = attrPattern.exec(content)) !== null) {
		const key = match[1]
		const value = match[2]
		if (key && value !== undefined) {
			result.attrs[key] = value
		}
	}

	return result
}

/**
 * Parse the info string after :::
 * Returns component name (if any) and attribute string (if any)
 *
 * Supports Pandoc-style trailing colons: `::: Warning ::::::` or `::::: {.class} :::::`
 */
function parseInfo(info: string): {
	componentName: string | null
	attrString: string | null
} {
	const trimmed = info.trim()

	// Pattern: optional component-name followed by optional {attributes} followed by optional trailing colons
	// Examples: "Warning", "{.class}", "Warning {.class}", "Warning ::::::", "{.class} :::::"
	const match = trimmed.match(/^(\w[\w-]*)?\s*(\{[^}]*\})?\s*:*$/)

	if (!match) {
		return { componentName: null, attrString: null }
	}

	return {
		componentName: match[1] ?? null,
		attrString: match[2] ?? null,
	}
}

/**
 * Fenced div plugin for markdown-it
 */
export function fencedDiv(md: MarkdownIt): void {
	const MIN_MARKERS = 3
	const MARKER_CHAR = 0x3a // ':'

	function container(
		state: StateBlock,
		startLine: number,
		endLine: number,
		silent: boolean,
	): boolean {
		let pos
		let autoClosed = false
		const start =
			(state.bMarks[startLine] ?? 0) + (state.tShift[startLine] ?? 0)
		const max = state.eMarks[startLine] ?? 0

		// Quick check: first character must be ':'
		if (MARKER_CHAR !== state.src.charCodeAt(start)) {
			return false
		}

		// Count the number of marker characters
		for (pos = start + 1; pos <= max; pos++) {
			if (state.src.charCodeAt(pos) !== MARKER_CHAR) {
				break
			}
		}

		const markerCount = pos - start
		if (markerCount < MIN_MARKERS) {
			return false
		}

		const markup = state.src.slice(start, pos)
		const params = state.src.slice(pos, max)

		// Parse the info string (component name and/or attributes)
		const { componentName, attrString } = parseInfo(params)

		// If we have something after ::: that doesn't match our pattern, don't match
		// (allows other ::: based syntax to work)
		if (params.trim() && !componentName && !attrString) {
			return false
		}

		// Since start is found, we can report success here in validation mode
		if (silent) {
			return true
		}

		// Search for the end of the block
		let nextLine = startLine
		let nestLevel = 1

		for (;;) {
			nextLine++
			if (nextLine >= endLine) {
				// unclosed block should be autoclosed by end of document
				break
			}

			const lineStart =
				(state.bMarks[nextLine] ?? 0) + (state.tShift[nextLine] ?? 0)
			const lineMax = state.eMarks[nextLine] ?? 0

			if (
				lineStart < lineMax
				&& (state.sCount[nextLine] ?? 0) < state.blkIndent
			) {
				// non-empty line with negative indent should stop the block
				break
			}

			// Check if line starts with :::
			if (state.src.charCodeAt(lineStart) !== MARKER_CHAR) {
				continue
			}

			if ((state.sCount[nextLine] ?? 0) - state.blkIndent >= 4) {
				// closing fence should be indented less than 4 spaces
				continue
			}

			// Count markers on this line
			let closePos = lineStart + 1
			while (
				closePos <= lineMax
				&& state.src.charCodeAt(closePos) === MARKER_CHAR
			) {
				closePos++
			}

			const closeMarkerCount = closePos - lineStart
			if (closeMarkerCount < MIN_MARKERS) {
				continue
			}

			// Check if this is a nested opener or closer
			const lineParams = state.src.slice(closePos, lineMax).trim()

			if (lineParams) {
				// This line has content after :::, check if it's an opener
				const parsedLine = parseInfo(lineParams)
				if (parsedLine.componentName || parsedLine.attrString) {
					// It's a nested opener
					nestLevel++
					continue
				}
			} else {
				// Just :::, it's a closer
				nestLevel--
				if (nestLevel === 0) {
					// Make sure tail has spaces only
					const tailPos = state.skipSpaces(closePos)
					if (tailPos < lineMax) {
						continue
					}
					// Found the closing fence!
					autoClosed = true
					break
				}
			}
		}

		const oldParent = state.parentType
		const oldLineMax = state.lineMax

		state.parentType = 'container' as typeof state.parentType
		state.lineMax = nextLine

		// Determine the tag: use component name if provided, otherwise 'div'
		const tag = componentName ?? 'div'

		// Create opening token
		const tokenOpen = state.push('fenced_div_open', tag, 1)
		tokenOpen.markup = markup
		tokenOpen.block = true
		tokenOpen.info = params
		tokenOpen.map = [startLine, nextLine]

		// Parse and set attributes (component name is the tag, not a class)
		const parsed = parseAttributes(attrString ?? '')

		if (parsed.classes.length > 0) {
			tokenOpen.attrSet('class', parsed.classes.join(' '))
		}
		if (parsed.id) {
			tokenOpen.attrSet('id', parsed.id)
		}
		for (const [key, value] of Object.entries(parsed.attrs)) {
			tokenOpen.attrSet(key, value)
		}

		// Parse content
		state.md.block.tokenize(state, startLine + 1, nextLine)

		// Create closing token (use same tag as opening)
		const tokenClose = state.push('fenced_div_close', tag, -1)
		const closeBMarks = state.bMarks[nextLine] ?? 0
		const closeTShift = state.tShift[nextLine] ?? 0
		tokenClose.markup = state.src.slice(
			closeBMarks + closeTShift,
			closeBMarks + closeTShift + markerCount,
		)
		tokenClose.block = true

		state.parentType = oldParent
		state.lineMax = oldLineMax
		state.line = nextLine + (autoClosed ? 1 : 0)

		return true
	}

	md.block.ruler.before('fence', 'fenced_div', container, {
		alt: ['paragraph', 'reference', 'blockquote', 'list'],
	})
}
