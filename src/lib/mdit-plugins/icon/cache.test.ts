import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { IconCache } from './cache.js'

describe('IconCache', () => {
	let cacheDir: string
	let cache: IconCache

	beforeEach(() => {
		cacheDir = mkdtempSync(join(tmpdir(), 'icon-cache-test-'))
		cache = new IconCache(cacheDir)
	})

	afterEach(() => {
		rmSync(cacheDir, { recursive: true, force: true })
	})

	describe('in-memory cache', () => {
		it('returns null for unknown keys', () => {
			expect(cache.get('devicon/react')).toBeNull()
		})

		it('stores and retrieves values', () => {
			cache.set('devicon/react', '<svg>react</svg>')
			expect(cache.get('devicon/react')).toBe('<svg>react</svg>')
		})

		it('reports has correctly', () => {
			expect(cache.has('devicon/react')).toBe(false)
			cache.set('devicon/react', '<svg>react</svg>')
			expect(cache.has('devicon/react')).toBe(true)
		})
	})

	describe('file cache', () => {
		it('persists to disk on set', () => {
			cache.set('devicon/react', '<svg>react</svg>')
			// File should exist under cacheDir
			const files = readdirDeep(cacheDir)
			expect(files.length).toBeGreaterThan(0)
		})

		it('loads from disk when not in memory', () => {
			// First cache: write to disk
			cache.set('devicon/react', '<svg>react</svg>')

			// Second cache instance with same dir: should find it on disk
			const cache2 = new IconCache(cacheDir)
			expect(cache2.get('devicon/react')).toBe('<svg>react</svg>')
		})

		it('uses safe filenames for cache keys with special characters', () => {
			cache.set('wiki:f/f1/PwC_2025_Logo.svg', '<img src="data:...">')
			const cache2 = new IconCache(cacheDir)
			expect(cache2.get('wiki:f/f1/PwC_2025_Logo.svg')).toBe(
				'<img src="data:...">',
			)
		})
	})

	describe('clearCache', () => {
		it('removes all cached entries from memory and disk', () => {
			cache.set('devicon/react', '<svg>react</svg>')
			cache.set('mdi/home', '<svg>home</svg>')
			expect(cache.has('devicon/react')).toBe(true)

			cache.clear()

			expect(cache.has('devicon/react')).toBe(false)
			expect(cache.has('mdi/home')).toBe(false)
			// Dir should be empty or removed
			const files = readdirDeep(cacheDir)
			expect(files.length).toBe(0)
		})
	})
})

/** Recursively list all files under a directory */
function readdirDeep(dir: string): string[] {
	if (!existsSync(dir)) return []
	const entries = readdirSync(dir, { withFileTypes: true })
	const files: string[] = []
	for (const entry of entries) {
		const full = join(dir, entry.name)
		if (entry.isDirectory()) {
			files.push(...readdirDeep(full))
		} else {
			files.push(full)
		}
	}
	return files
}
