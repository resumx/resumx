/**
 * Link Classification
 *
 * Classifies <a> elements by their href: mailto → email, tel → phone,
 * social domains → profiles, generic http(s) → url.
 */

import { detectSocialProfile } from './social.js'

// =============================================================================
// Types & Classifiers
// =============================================================================

type LinkClassifier = {
	match: (href: string) => boolean
	classify: (link: Element, href: string) => void
}

const LINK_CLASSIFIERS: LinkClassifier[] = [
	{
		match: href => href.startsWith('mailto:'),
		classify: link => link.setAttribute('data-field', 'email'),
	},
	{
		match: href => href.startsWith('tel:'),
		classify: link => link.setAttribute('data-field', 'phone'),
	},
	{
		match: href => !!detectSocialProfile(href),
		classify: (link, href) => {
			const profile = detectSocialProfile(href)!
			link.setAttribute('data-field', 'profiles')
			link.setAttribute('data-network', profile.network)
			if (profile.username) {
				link.setAttribute('data-username', profile.username)
			}
		},
	},
	{
		match: href => href.startsWith('http://') || href.startsWith('https://'),
		classify: link => {
			// Only mark as URL if not already marked
			if (!link.hasAttribute('data-field')) {
				link.setAttribute('data-field', 'url')
			}
		},
	},
]

// =============================================================================
// Main
// =============================================================================

/**
 * Classify a link element based on its href.
 */
export function classifyLink(link: Element): void {
	const href = link.getAttribute('href') || ''

	for (const { match, classify } of LINK_CLASSIFIERS) {
		if (match(href)) {
			classify(link, href)
			return
		}
	}
}
