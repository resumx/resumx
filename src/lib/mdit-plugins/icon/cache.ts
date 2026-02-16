/**
 * Two-layer icon cache: in-memory Map + persistent file cache.
 * Maps icon name -> self-contained HTML (inline SVG or data URI img tag).
 *
 * The cache is resolver-agnostic: it stores whatever HTML the resolvers
 * produce, whether that's an inline <svg>, a data-URI <img>, or anything else.
 */

import {
	existsSync,
	mkdirSync,
	readFileSync,
	writeFileSync,
	rmSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

/**
 * Hash an icon name to a safe filename.
 * Uses SHA-256 truncated to 16 hex chars (64 bits, collision-safe for <10k icons).
 */
function cacheKey(name: string): string {
	return createHash('sha256').update(name).digest('hex').slice(0, 16)
}

export class IconCache {
	private memory = new Map<string, string>()
	private dir: string

	constructor(cacheDir: string) {
		this.dir = cacheDir
	}

	/** Check in-memory, then file cache */
	get(name: string): string | null {
		// Layer 1: in-memory
		const mem = this.memory.get(name)
		if (mem !== undefined) return mem

		// Layer 2: file cache
		const filePath = join(this.dir, cacheKey(name))
		if (existsSync(filePath)) {
			const html = readFileSync(filePath, 'utf-8')
			this.memory.set(name, html) // promote to memory
			return html
		}

		return null
	}

	/** Store to both in-memory and file cache */
	set(name: string, html: string): void {
		this.memory.set(name, html)

		// Ensure cache directory exists
		if (!existsSync(this.dir)) {
			mkdirSync(this.dir, { recursive: true })
		}

		writeFileSync(join(this.dir, cacheKey(name)), html, 'utf-8')
	}

	/** Check if cached without reading value */
	has(name: string): boolean {
		if (this.memory.has(name)) return true
		return existsSync(join(this.dir, cacheKey(name)))
	}

	/** Clear all cached entries from memory and disk */
	clear(): void {
		this.memory.clear()
		if (existsSync(this.dir)) {
			rmSync(this.dir, { recursive: true, force: true })
			mkdirSync(this.dir, { recursive: true })
		}
	}
}
