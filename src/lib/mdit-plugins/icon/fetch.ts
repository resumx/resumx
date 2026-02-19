/**
 * Async fetch functions for icon resolution.
 * Produces self-contained HTML: inline SVGs for Iconify.
 */

import { getIconData, iconToSVG, iconToHTML } from '@iconify/utils'
import type { IconifyJSON } from '@iconify/types'

const ICONIFY_API = 'https://api.iconify.design'

/**
 * Batch-fetch Iconify icons and return a map of iconId -> inline SVG HTML.
 *
 * Groups icons by prefix and makes one API request per prefix:
 *   GET https://api.iconify.design/{prefix}.json?icons=name1,name2,...
 *
 * Uses @iconify/utils to convert the JSON response to SVG strings.
 */
export async function fetchIconifySvgs(
	iconIds: string[],
): Promise<Map<string, string>> {
	const result = new Map<string, string>()
	if (iconIds.length === 0) return result

	// Group by prefix
	const groups = new Map<string, string[]>()
	for (const id of iconIds) {
		const slashIdx = id.indexOf('/')
		if (slashIdx === -1) continue // skip invalid format
		const prefix = id.slice(0, slashIdx)
		const name = id.slice(slashIdx + 1)
		if (!prefix || !name) continue
		const names = groups.get(prefix) ?? []
		names.push(name)
		groups.set(prefix, names)
	}

	// Fetch each prefix group in parallel
	const fetches = [...groups.entries()].map(async ([prefix, names]) => {
		try {
			const url = `${ICONIFY_API}/${prefix}.json?icons=${names.join(',')}`
			const response = await fetch(url)
			if (!response.ok) return

			const data = (await response.json()) as IconifyJSON
			for (const name of names) {
				const iconData = getIconData(data, name)
				if (!iconData) continue

				const { attributes, body } = iconToSVG(iconData, { height: '1em' })
				const svg = iconToHTML(body, {
					...attributes,
					class: 'icon iconify',
					'data-icon': `${prefix}/${name}`,
				})
				result.set(`${prefix}/${name}`, svg)
			}
		} catch {
			// Silently skip failed fetches
		}
	})

	await Promise.all(fetches)
	return result
}
