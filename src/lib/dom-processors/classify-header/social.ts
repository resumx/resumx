/**
 * Social Platform Detection
 *
 * Handles detection of social network domains and profile extraction.
 */

// =============================================================================
// Social Network Definitions
// =============================================================================

/**
 * Social network definitions - single source of truth
 * Each entry maps one domain to a network name and username extraction pattern
 * Multiple entries can share the same network (e.g., x.com and twitter.com)
 */
export const SOCIAL_NETWORKS: Array<{
	domain: string
	network: string
	usernamePattern: RegExp
}> = [
	{
		domain: 'linkedin.com',
		network: 'linkedin',
		usernamePattern: /linkedin\.com\/in\/([^/?#]+)/i,
	},
	{
		domain: 'github.com',
		network: 'github',
		usernamePattern: /github\.com\/([^/?#]+)/i,
	},
	{
		domain: 'gitlab.com',
		network: 'gitlab',
		usernamePattern: /gitlab\.com\/([^/?#]+)/i,
	},
	{
		domain: 'x.com',
		network: 'x',
		usernamePattern: /x\.com\/([^/?#]+)/i,
	},
	{
		domain: 'twitter.com',
		network: 'x',
		usernamePattern: /twitter\.com\/([^/?#]+)/i,
	},
	{
		domain: 'facebook.com',
		network: 'facebook',
		usernamePattern: /facebook\.com\/([^/?#]+)/i,
	},
	{
		domain: 'instagram.com',
		network: 'instagram',
		usernamePattern: /instagram\.com\/([^/?#]+)/i,
	},
	{
		domain: 'youtube.com',
		network: 'youtube',
		usernamePattern: /youtube\.com\/(?:@|c\/|channel\/|user\/)?([^/?#]+)/i,
	},
	{
		domain: 'youtu.be',
		network: 'youtube',
		usernamePattern: /youtu\.be\/([^/?#]+)/i,
	},
	{
		domain: 'stackoverflow.com',
		network: 'stackoverflow',
		usernamePattern: /stackoverflow\.com\/users\/\d+\/([^/?#]+)/i,
	},
	{
		domain: 'dribbble.com',
		network: 'dribbble',
		usernamePattern: /dribbble\.com\/([^/?#]+)/i,
	},
	{
		domain: 'behance.net',
		network: 'behance',
		usernamePattern: /behance\.net\/([^/?#]+)/i,
	},
	{
		domain: 'medium.com',
		network: 'medium',
		usernamePattern: /medium\.com\/@?([^/?#]+)/i,
	},
	{
		domain: 'dev.to',
		network: 'devto',
		usernamePattern: /dev\.to\/([^/?#]+)/i,
	},
	{
		domain: 'codepen.io',
		network: 'codepen',
		usernamePattern: /codepen\.io\/([^/?#]+)/i,
	},
	{
		domain: 'bitbucket.org',
		network: 'bitbucket',
		usernamePattern: /bitbucket\.org\/([^/?#]+)/i,
	},
	{
		domain: 'marketplace.visualstudio.com',
		network: 'vscode-marketplace',
		usernamePattern: /marketplace\.visualstudio\.com\/publishers\/([^/?#]+)/i,
	},
]

/**
 * Flat list of social domains for quick lookup
 */
export const SOCIAL_DOMAINS = SOCIAL_NETWORKS.map(n => n.domain)

// =============================================================================
// Detection Functions
// =============================================================================

/**
 * Check if a segment matches a social domain
 */
export function isSocialDomain(segment: string): boolean {
	const lower = segment.toLowerCase()
	return SOCIAL_DOMAINS.some(domain => lower.includes(domain))
}

/**
 * Detect social network and username from URL
 */
export function detectSocialProfile(href: string): {
	network: string
	username: string | null
} | null {
	const lowerHref = href.toLowerCase()
	for (const { domain, network, usernamePattern } of SOCIAL_NETWORKS) {
		if (lowerHref.includes(domain)) {
			const usernameMatch = href.match(usernamePattern)
			const username = usernameMatch?.[1] || null
			return { network, username }
		}
	}
	return null
}
