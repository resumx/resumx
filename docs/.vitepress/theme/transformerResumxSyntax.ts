import type { ShikiTransformer } from 'shiki'

export function transformerResumxSyntax(): ShikiTransformer {
	return {
		name: 'resumx-syntax',
		preprocess(code, options) {
			if (options.lang !== 'markdown' && options.lang !== 'md') return
			options.decorations ||= []

			const matched = new Set<string>()

			// 0) ::: fenced divs — dim colons, highlight attrs
			let fenceDepth = 0
			for (const m of code.matchAll(/^(:{3,})(\s*(\{)([^}]*)(\}))?/gm)) {
				const pos = m.index
				const colonLen = m[1].length
				// Opener = any non-whitespace content after colons (not just {…})
				const lineEnd = code.indexOf('\n', pos)
				const restOfLine = code.slice(
					pos + colonLen,
					lineEnd === -1 ? undefined : lineEnd,
				)
				const isOpener = restOfLine.trim().length > 0
				if (!isOpener) fenceDepth = Math.max(0, fenceDepth - 1)
				const depthClass = `resumx-fence resumx-fence-d${Math.min(fenceDepth, 2)}`
				// colons → gray with depth-based opacity
				options.decorations.push({
					start: pos,
					end: pos + colonLen,
					properties: { class: depthClass },
				})
				if (isOpener) fenceDepth++
				// Track full match so later patterns skip these positions
				for (let i = pos; i < pos + m[0].length; i++) matched.add(String(i))

				if (m[4] !== undefined) {
					const braceOffset = m[2].indexOf('{')
					const braceStart = pos + colonLen + braceOffset
					// {
					options.decorations.push({
						start: braceStart,
						end: braceStart + 1,
						properties: { class: 'resumx-delim' },
					})
					// attr text
					options.decorations.push({
						start: braceStart + 1,
						end: braceStart + 1 + m[4].length,
						properties: { class: 'resumx-attr' },
					})
					// }
					options.decorations.push({
						start: braceStart + 1 + m[4].length,
						end: braceStart + 2 + m[4].length,
						properties: { class: 'resumx-delim' },
					})
				} else if (isOpener) {
					// Bare component name (no braces) — gray like attrs
					const nameStart =
						pos + colonLen + (restOfLine.length - restOfLine.trimStart().length)
					const nameEnd = lineEnd === -1 ? code.length : lineEnd
					options.decorations.push({
						start: nameStart,
						end: nameEnd,
						properties: { class: 'resumx-attr' },
					})
					for (let i = pos + m[0].length; i < nameEnd; i++)
						matched.add(String(i))
				}
			}

			// 1) {{ variable }} — muted teal for variable, dimmed brackets
			for (const m of code.matchAll(/\{\{(\s*\w+\s*)\}\}/g)) {
				if (matched.has(String(m.index))) continue
				let pos = m.index
				// {{
				options.decorations.push({
					start: pos,
					end: pos + 2,
					properties: { class: 'resumx-var-delim' },
				})
				pos += 2
				// variable name
				options.decorations.push({
					start: pos,
					end: pos + m[1].length,
					properties: { class: 'resumx-var' },
				})
				pos += m[1].length
				// }}
				options.decorations.push({
					start: pos,
					end: pos + 2,
					properties: { class: 'resumx-var-delim' },
				})
				for (let i = m.index; i < m.index + m[0].length; i++)
					matched.add(String(i))
			}

			// 2) Headings — color per level (not added to matched so icons/bold/italic still apply)
			for (const m of code.matchAll(/^(#{1,6})\s/gm)) {
				const level = m[1].length
				const lineEnd = code.indexOf('\n', m.index)
				const end = lineEnd === -1 ? code.length : lineEnd
				options.decorations.push({
					start: m.index,
					end,
					properties: { class: `resumx-h${level}` },
				})
			}

			// 3) [text]{.attrs} — dim [ ] { } brackets, italic inner attr text
			for (const m of code.matchAll(/(\[)([^\]]*)(\])\{([^}]*)\}/g)) {
				let pos = m.index
				// [
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// inner text — keep default
				pos += m[2].length
				// ]
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// {
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// attr text
				options.decorations.push({
					start: pos,
					end: pos + m[4].length,
					properties: { class: 'resumx-attr' },
				})
				pos += m[4].length
				// }
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				// Track full range so standalone {} doesn't double-match
				for (let i = m.index; i < m.index + m[0].length; i++)
					matched.add(String(i))
			}

			// 4) Standalone {attrs} — dim { }, italic inner text
			// Matches {.class}, {#id}, {lang=en}, and combinations thereof
			for (const m of code.matchAll(
				/(?<!\])\{((?:[.#][\w:.@/\-]+|[\w-]+=[\w-]+)(?:\s+(?:[.#][\w:.@/\-]+|[\w-]+=[\w-]+))*)\}/g,
			)) {
				if (!matched.has(String(m.index))) {
					let pos = m.index
					// {
					options.decorations.push({
						start: pos,
						end: pos + 1,
						properties: { class: 'resumx-delim' },
					})
					pos += 1
					// attr text
					options.decorations.push({
						start: pos,
						end: pos + m[1].length,
						properties: { class: 'resumx-attr' },
					})
					pos += m[1].length
					// }
					options.decorations.push({
						start: pos,
						end: pos + 1,
						properties: { class: 'resumx-delim' },
					})
				}
			}

			// 5) :icon: or :prefix/name: — dim delimiters, color the name
			for (const m of code.matchAll(
				/:([a-zA-Z0-9][a-zA-Z0-9_-]*(?:\/[a-zA-Z0-9][a-zA-Z0-9_-]*)?):(?!:)/g,
			)) {
				if (matched.has(String(m.index))) continue
				const name = m[1]!
				options.decorations.push({
					start: m.index,
					end: m.index + 1,
					properties: { class: 'resumx-icon' },
				})
				options.decorations.push({
					start: m.index + 1,
					end: m.index + 1 + name.length,
					properties: { class: 'resumx-icon' },
				})
				options.decorations.push({
					start: m.index + 1 + name.length,
					end: m.index + m[0].length,
					properties: { class: 'resumx-icon' },
				})
			}

			// 6) [text](url) — dim brackets and URL, reset display text to default
			for (const m of code.matchAll(/\[([^\]]*)\]\(([^)]*)\)/g)) {
				if (matched.has(String(m.index))) continue

				let pos = m.index
				// [
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// inner text — reset to default foreground
				options.decorations.push({
					start: pos,
					end: pos + m[1].length,
					properties: { class: 'resumx-link-text' },
				})
				pos += m[1].length
				// ]
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// (url)
				options.decorations.push({
					start: pos,
					end: pos + m[2].length + 2,
					properties: { class: 'resumx-delim' },
				})
				for (let i = m.index; i < m.index + m[0].length; i++)
					matched.add(String(i))
			}

			// 6b) Plain-text emails and bare URLs — underline
			for (const m of code.matchAll(
				/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?<![[(\/])(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})\/[^\s|)\]"]*/g,
			)) {
				if (matched.has(String(m.index))) continue
				options.decorations.push({
					start: m.index,
					end: m.index + m[0].length,
					properties: { class: 'resumx-plain-link' },
				})
			}

			// 7) | delimiters between links (both markdown and plain-text) — dim
			for (const m of code.matchAll(/(?<=\)) \| (?=\[)/g)) {
				options.decorations.push({
					start: m.index,
					end: m.index + m[0].length,
					properties: { class: 'resumx-delim' },
				})
			}
			// 7a) | between plain-text contact items — dim
			for (const m of code.matchAll(/(?<=[a-zA-Z0-9/]) \| (?=[a-zA-Z0-9])/g)) {
				if (matched.has(String(m.index))) continue
				options.decorations.push({
					start: m.index,
					end: m.index + 3,
					properties: { class: 'resumx-delim' },
				})
			}

			// 7b) || column separator — dim
			for (const m of code.matchAll(/(?<!\|)\|\|(?!\|)/g)) {
				if (matched.has(String(m.index))) continue
				options.decorations.push({
					start: m.index,
					end: m.index + 2,
					properties: { class: 'resumx-col-sep' },
				})
			}

			// 8) ***bold italic*** and ___bold italic___ — dim delimiters, bold+italic inner text
			for (const m of code.matchAll(/\*\*\*(.+?)\*\*\*/g)) {
				if (matched.has(String(m.index))) continue
				let pos = m.index
				// ***
				options.decorations.push({
					start: pos,
					end: pos + 3,
					properties: { class: 'resumx-delim' },
				})
				pos += 3
				// inner text
				options.decorations.push({
					start: pos,
					end: pos + m[1].length,
					properties: { class: 'resumx-bold-italic' },
				})
				pos += m[1].length
				// ***
				options.decorations.push({
					start: pos,
					end: pos + 3,
					properties: { class: 'resumx-delim' },
				})
				for (let i = m.index; i < m.index + m[0].length; i++)
					matched.add(String(i))
			}

			for (const m of code.matchAll(/___(.+?)___/g)) {
				if (matched.has(String(m.index))) continue
				let pos = m.index
				// ___
				options.decorations.push({
					start: pos,
					end: pos + 3,
					properties: { class: 'resumx-delim' },
				})
				pos += 3
				// inner text
				options.decorations.push({
					start: pos,
					end: pos + m[1].length,
					properties: { class: 'resumx-bold-italic' },
				})
				pos += m[1].length
				// ___
				options.decorations.push({
					start: pos,
					end: pos + 3,
					properties: { class: 'resumx-delim' },
				})
				for (let i = m.index; i < m.index + m[0].length; i++)
					matched.add(String(i))
			}

			// 9) **bold** and __bold__ — dim delimiters, bold inner text
			for (const m of code.matchAll(/\*\*(.+?)\*\*/g)) {
				if (matched.has(String(m.index))) continue
				let pos = m.index
				// **
				options.decorations.push({
					start: pos,
					end: pos + 2,
					properties: { class: 'resumx-delim' },
				})
				pos += 2
				// inner text
				options.decorations.push({
					start: pos,
					end: pos + m[1].length,
					properties: { class: 'resumx-bold' },
				})
				pos += m[1].length
				// **
				options.decorations.push({
					start: pos,
					end: pos + 2,
					properties: { class: 'resumx-delim' },
				})
				for (let i = m.index; i < m.index + m[0].length; i++)
					matched.add(String(i))
			}

			for (const m of code.matchAll(/__(.+?)__/g)) {
				if (matched.has(String(m.index))) continue
				let pos = m.index
				// __
				options.decorations.push({
					start: pos,
					end: pos + 2,
					properties: { class: 'resumx-delim' },
				})
				pos += 2
				// inner text
				options.decorations.push({
					start: pos,
					end: pos + m[1].length,
					properties: { class: 'resumx-bold' },
				})
				pos += m[1].length
				// __
				options.decorations.push({
					start: pos,
					end: pos + 2,
					properties: { class: 'resumx-delim' },
				})
				for (let i = m.index; i < m.index + m[0].length; i++)
					matched.add(String(i))
			}

			// 10) *italic* and _italic_ — dim delimiters, italic inner text
			for (const m of code.matchAll(/\*([^*]+)\*/g)) {
				if (matched.has(String(m.index))) continue
				let pos = m.index
				// *
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// inner text
				options.decorations.push({
					start: pos,
					end: pos + m[1].length,
					properties: { class: 'resumx-italic' },
				})
				pos += m[1].length
				// *
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				for (let i = m.index; i < m.index + m[0].length; i++)
					matched.add(String(i))
			}

			for (const m of code.matchAll(/_([^_]+)_/g)) {
				if (matched.has(String(m.index))) continue
				let pos = m.index
				// _
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				pos += 1
				// inner text
				options.decorations.push({
					start: pos,
					end: pos + m[1].length,
					properties: { class: 'resumx-italic' },
				})
				pos += m[1].length
				// _
				options.decorations.push({
					start: pos,
					end: pos + 1,
					properties: { class: 'resumx-delim' },
				})
				for (let i = m.index; i < m.index + m[0].length; i++)
					matched.add(String(i))
			}
		},
	}
}
