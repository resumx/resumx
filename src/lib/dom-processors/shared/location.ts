/**
 * Shared Location Detection
 *
 * Handles detection of location text using city database and patterns.
 * This module is used by both classify-header and classify-entry-fields processors.
 */

import citiesData from 'cities.json' with { type: 'json' }

// =============================================================================
// Location Data
// =============================================================================

/**
 * Build a Set of city names for fast lookup.
 * Only include cities with population > 50,000 to reduce false positives.
 * Also normalize to lowercase for case-insensitive matching.
 */
export const CITY_NAMES: Set<string> = new Set(
	(citiesData as Array<{ name: string }>).map(c => c.name.toLowerCase()),
)

/**
 * Additional location terms that indicate location context
 */
export const LOCATION_TERMS = new Set([
	'remote',
	'hybrid',
	'worldwide',
	'global',
])

/**
 * Location pattern: "City, ST" or "City, State/Country" format
 * Captures city name (group 1) for validation against cities.json database
 */
export const LOCATION_PATTERN =
	/^([A-Za-z][A-Za-z\s]+),\s*([A-Z]{2}|[A-Za-z][A-Za-z\s]+)$/

// =============================================================================
// Detection Functions
// =============================================================================

/**
 * Check if a text segment is a location
 */
export function isLocation(text: string): boolean {
	const trimmed = text.trim()
	if (!trimmed) return false

	// Check "City, ST" or "City, State/Country" format
	const match = trimmed.match(LOCATION_PATTERN)
	if (match) {
		const city = match[1]!.trim().toLowerCase()
		const region = match[2]!.trim()

		// A 2-letter uppercase region code (US state or country code) is a
		// strong location signal — trust the pattern without requiring a
		// cities-database hit (e.g. "New York, NY" where "New York" is stored
		// as "New York City" in the DB).
		if (/^[A-Z]{2}$/.test(region)) return true

		// For longer region names, validate city against database
		if (CITY_NAMES.has(city)) return true
	}

	// Multi-part locations like "Paris, Île-de-France, France"
	// The basic LOCATION_PATTERN only handles one comma; fall back to
	// splitting on the first comma and checking the city part.
	if (trimmed.includes(',')) {
		const firstPart = trimmed.split(',')[0]!.trim().toLowerCase()
		if (CITY_NAMES.has(firstPart)) return true
	}

	// Check special location terms
	if (LOCATION_TERMS.has(trimmed.toLowerCase())) return true

	// Check against city database (case-insensitive)
	// This handles single-word cities and multi-word cities like "Hong Kong"
	if (CITY_NAMES.has(trimmed.toLowerCase())) return true

	return false
}

/**
 * Check if an element contains ONLY location text (no contact links).
 * Used to identify elements like "<p>Hong Kong</p>" that should be
 * merged with adjacent contact elements.
 */
export function isLocationOnly(element: Element): boolean {
	const text = element.textContent?.trim() || ''
	if (!text) return false

	// Must not have any links
	if (element.querySelector('a')) return false

	return isLocation(text)
}
