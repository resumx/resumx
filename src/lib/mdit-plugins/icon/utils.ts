import { escapeHtml } from '@mdit/helper'

/**
 * Builds the HTML string for an Iconify icon.
 *
 * @param iconId - Iconify id (e.g. `devicon:typescript`, `mdi:home`). Trimmed and escaped.
 * @returns HTML string: `<iconify-icon icon="..." style="..."></iconify-icon>`.
 */
export function iconifyHtml(iconId: string): string {
	const id = iconId.trim()
	return `<iconify-icon icon="${escapeHtml(id)}" style="vertical-align: -0.125em; display: inline-block;"></iconify-icon>`
}
