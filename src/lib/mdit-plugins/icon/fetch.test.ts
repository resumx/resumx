import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchIconifySvgs } from './fetch.js'

// ── Mock global fetch ───────────────────────────────────────────────────────

const mockFetch = vi.fn()

beforeEach(() => {
	vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
	vi.restoreAllMocks()
})

// ── fetchIconifySvgs ────────────────────────────────────────────────────────

describe('fetchIconifySvgs', () => {
	it('batch-fetches icons grouped by prefix and returns SVG map', async () => {
		// Mock Iconify JSON API response for devicon set
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve({
					prefix: 'devicon',
					icons: {
						react: {
							body: '<circle cx="64" cy="64" r="64"/>',
							width: 128,
							height: 128,
						},
						typescript: {
							body: '<rect width="128" height="128"/>',
							width: 128,
							height: 128,
						},
					},
				}),
		})

		const result = await fetchIconifySvgs([
			'devicon/react',
			'devicon/typescript',
		])

		expect(result.size).toBe(2)
		const reactSvg = result.get('devicon/react')!
		expect(reactSvg).toContain('<svg')
		expect(reactSvg).toContain('class="icon iconify"')
		expect(reactSvg).toContain('data-icon="devicon/react"')
		expect(reactSvg).toContain('<circle')

		const tsSvg = result.get('devicon/typescript')!
		expect(tsSvg).toContain('<svg')
		expect(tsSvg).toContain('data-icon="devicon/typescript"')
		expect(tsSvg).toContain('<rect')
	})

	it('handles multiple prefixes in separate batch requests', async () => {
		// Two separate API calls: one for devicon, one for mdi
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						prefix: 'devicon',
						icons: {
							react: { body: '<path d="react"/>', width: 128, height: 128 },
						},
					}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () =>
					Promise.resolve({
						prefix: 'mdi',
						icons: {
							home: { body: '<path d="home"/>', width: 24, height: 24 },
						},
					}),
			})

		const result = await fetchIconifySvgs(['devicon/react', 'mdi/home'])

		expect(result.size).toBe(2)
		expect(result.get('devicon/react')).toContain('<path d="react"')
		expect(result.get('mdi/home')).toContain('<path d="home"')
		expect(result.get('devicon/react')).toContain('data-icon="devicon/react"')
		expect(result.get('mdi/home')).toContain('data-icon="mdi/home"')
		expect(mockFetch).toHaveBeenCalledTimes(2)
	})

	it('skips icons without a slash (not valid Iconify format)', async () => {
		const result = await fetchIconifySvgs(['react', 'noprefix'])
		expect(result.size).toBe(0)
		expect(mockFetch).not.toHaveBeenCalled()
	})

	it('returns empty map when API fails', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

		const result = await fetchIconifySvgs(['devicon/nonexistent'])
		expect(result.size).toBe(0)
	})

	it('returns empty map for empty input', async () => {
		const result = await fetchIconifySvgs([])
		expect(result.size).toBe(0)
		expect(mockFetch).not.toHaveBeenCalled()
	})
})
