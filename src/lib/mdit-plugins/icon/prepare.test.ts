import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { IconCache } from './cache.js'
import { prepareIcons } from './prepare.js'
import { createAsyncIconifyResolver } from './renderer.js'

// ── Mock fetch ──────────────────────────────────────────────────────────────

const mockFetch = vi.fn()

beforeEach(() => {
	vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
	vi.restoreAllMocks()
})

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeIconifyResponse(
	prefix: string,
	icons: Record<string, { body: string; width: number; height: number }>,
) {
	return {
		ok: true,
		json: () => Promise.resolve({ prefix, icons }),
	}
}

/** Standard async resolver chain matching the production configuration */
const asyncResolvers = [createAsyncIconifyResolver()]

// ── Tests ───────────────────────────────────────────────────────────────────

describe('prepareIcons', () => {
	let cacheDir: string
	let cache: IconCache

	beforeEach(() => {
		cacheDir = mkdtempSync(join(tmpdir(), 'prepare-test-'))
		cache = new IconCache(cacheDir)
	})

	afterEach(() => {
		rmSync(cacheDir, { recursive: true, force: true })
	})

	it('resolves explicit Iconify format via catch-all resolver', async () => {
		mockFetch.mockResolvedValueOnce(
			makeIconifyResponse('mdi', {
				home: { body: '<path d="home"/>', width: 24, height: 24 },
			}),
		)

		await prepareIcons(':mdi/home: icon', cache, asyncResolvers)

		const svg = cache.get('mdi/home')
		expect(svg).not.toBeNull()
		expect(svg).toContain('<path d="home"')
	})

	it('skips icons already in cache', async () => {
		cache.set('mdi/home', '<svg>cached</svg>')

		await prepareIcons(':mdi/home:', cache, asyncResolvers)

		expect(mockFetch).not.toHaveBeenCalled()
		expect(cache.get('mdi/home')).toBe('<svg>cached</svg>')
	})

	it('handles multiple icons in one document', async () => {
		mockFetch
			.mockResolvedValueOnce(
				makeIconifyResponse('mdi', {
					home: { body: '<circle/>', width: 24, height: 24 },
				}),
			)
			.mockResolvedValueOnce(
				makeIconifyResponse('mdi', {
					star: { body: '<rect/>', width: 24, height: 24 },
				}),
			)

		await prepareIcons(':mdi/home: and :mdi/star: icons', cache, asyncResolvers)

		expect(cache.get('mdi/home')).toContain('<circle')
		expect(cache.get('mdi/star')).toContain('<rect')
	})

	it('handles content with no icons', async () => {
		await prepareIcons('Just plain text.', cache, asyncResolvers)
		expect(mockFetch).not.toHaveBeenCalled()
	})

	it('works with custom resolvers (cache is resolver-agnostic)', async () => {
		const customResolver = async (name: string) =>
			name === 'star' ? '<span class="star">★</span>' : null

		await prepareIcons(':star: :unknown:', cache, [customResolver])

		expect(cache.get('star')).toBe('<span class="star">★</span>')
		expect(cache.has('unknown')).toBe(false)
	})
})
