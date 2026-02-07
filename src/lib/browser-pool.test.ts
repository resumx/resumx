import { describe, it, expect, afterEach } from 'vitest'
import { createBrowserPool, browserPool } from './browser-pool.js'

describe('browser-pool', () => {
	// =========================================================================
	// createBrowserPool Factory
	// =========================================================================

	describe('createBrowserPool', () => {
		it('creates a browser pool with specified size', async () => {
			const pool = createBrowserPool(2)

			try {
				const stats = pool.stats()
				// Initially, no browsers are launched (lazy initialization)
				expect(stats.total).toBe(0)
				expect(stats.available).toBe(0)
				expect(stats.inUse).toBe(0)

				// Acquire a browser to trigger initialization
				const browser1 = await pool.acquire()
				expect(browser1).toBeDefined()

				const statsAfterAcquire = pool.stats()
				expect(statsAfterAcquire.total).toBe(2)
				expect(statsAfterAcquire.available).toBe(1)
				expect(statsAfterAcquire.inUse).toBe(1)
			} finally {
				await pool.closeAll()
			}
		})

		it('acquire returns available browsers immediately', async () => {
			const pool = createBrowserPool(2)

			try {
				const browser1 = await pool.acquire()
				const browser2 = await pool.acquire()

				expect(browser1).toBeDefined()
				expect(browser2).toBeDefined()
				expect(browser1).not.toBe(browser2)

				const stats = pool.stats()
				expect(stats.total).toBe(2)
				expect(stats.available).toBe(0)
				expect(stats.inUse).toBe(2)
			} finally {
				await pool.closeAll()
			}
		})

		it('acquire waits when pool is exhausted', async () => {
			const pool = createBrowserPool(1)

			try {
				const browser1 = await pool.acquire()

				// This should block until browser1 is released
				let acquired = false
				const acquirePromise = pool.acquire().then(browser => {
					acquired = true
					return browser
				})

				// Give it a moment to ensure it's actually waiting
				await new Promise(resolve => setTimeout(resolve, 100))
				expect(acquired).toBe(false)

				// Release browser1
				pool.release(browser1)

				// Now acquire should complete
				const browser2 = await acquirePromise
				expect(acquired).toBe(true)
				expect(browser2).toBe(browser1) // Should get the same browser back
			} finally {
				await pool.closeAll()
			}
		})

		it('release returns browser to pool', async () => {
			const pool = createBrowserPool(2)

			try {
				const browser1 = await pool.acquire()
				expect(pool.stats().available).toBe(1)

				pool.release(browser1)
				expect(pool.stats().available).toBe(2)
			} finally {
				await pool.closeAll()
			}
		})

		it('release fulfills pending requests first', async () => {
			const pool = createBrowserPool(1)

			try {
				const browser1 = await pool.acquire()

				// Start a pending acquire
				let acquiredBrowser: any = null
				const pendingAcquire = pool.acquire().then(browser => {
					acquiredBrowser = browser
					return browser
				})

				// Release should fulfill the pending request
				pool.release(browser1)

				await pendingAcquire
				expect(acquiredBrowser).toBe(browser1)

				// Pool should still be exhausted
				expect(pool.stats().available).toBe(0)
			} finally {
				await pool.closeAll()
			}
		})

		it('closeAll closes all browsers', async () => {
			const pool = createBrowserPool(2)

			const browser1 = await pool.acquire()
			const browser2 = await pool.acquire()

			expect(browser1.isConnected()).toBe(true)
			expect(browser2.isConnected()).toBe(true)

			await pool.closeAll()

			expect(browser1.isConnected()).toBe(false)
			expect(browser2.isConnected()).toBe(false)
			expect(pool.stats().total).toBe(0)
		})

		it('closeAll is safe to call multiple times', async () => {
			const pool = createBrowserPool(1)

			await pool.acquire()
			await pool.closeAll()
			await pool.closeAll()
			await pool.closeAll()

			expect(pool.stats().total).toBe(0)
		})

		it('closeAll is safe to call without acquire', async () => {
			const pool = createBrowserPool(1)

			// Should not throw
			await pool.closeAll()
			expect(pool.stats().total).toBe(0)
		})

		it('acquire works after closeAll', async () => {
			const pool = createBrowserPool(1)

			try {
				const browser1 = await pool.acquire()
				expect(browser1.isConnected()).toBe(true)

				await pool.closeAll()
				expect(pool.stats().total).toBe(0)

				const browser2 = await pool.acquire()
				expect(browser2.isConnected()).toBe(true)
				expect(browser1.isConnected()).toBe(false)
			} finally {
				await pool.closeAll()
			}
		})

		it('rejects acquire after closeAll', async () => {
			const pool = createBrowserPool(1)

			await pool.acquire()
			await pool.closeAll()

			// Should throw when trying to acquire from closed pool
			await expect(pool.acquire()).rejects.toThrow('Browser pool is closing')
		})

		it('handles concurrent acquires', async () => {
			const pool = createBrowserPool(4)

			try {
				// Acquire 4 browsers concurrently
				const browsers = await Promise.all([
					pool.acquire(),
					pool.acquire(),
					pool.acquire(),
					pool.acquire(),
				])

				// All should be different browsers
				const uniqueBrowsers = new Set(browsers)
				expect(uniqueBrowsers.size).toBe(4)

				// Pool should be exhausted
				const stats = pool.stats()
				expect(stats.total).toBe(4)
				expect(stats.available).toBe(0)
				expect(stats.inUse).toBe(4)
			} finally {
				await pool.closeAll()
			}
		})

		it('multiple pools are independent', async () => {
			const pool1 = createBrowserPool(1)
			const pool2 = createBrowserPool(1)

			try {
				const browser1 = await pool1.acquire()
				const browser2 = await pool2.acquire()

				expect(browser1).not.toBe(browser2)
				expect(browser1.isConnected()).toBe(true)
				expect(browser2.isConnected()).toBe(true)

				// Closing one doesn't affect the other
				await pool1.closeAll()
				expect(pool1.stats().total).toBe(0)
				expect(pool2.stats().total).toBe(1)
			} finally {
				await pool1.closeAll()
				await pool2.closeAll()
			}
		})

		it('can create a new pool after closing', async () => {
			let pool = createBrowserPool(1)

			const browser1 = await pool.acquire()
			await pool.closeAll()

			// Create a new pool
			pool = createBrowserPool(1)

			try {
				const browser2 = await pool.acquire()
				expect(browser2).toBeDefined()
				expect(browser2.isConnected()).toBe(true)
				expect(browser2).not.toBe(browser1) // Different browser
			} finally {
				await pool.closeAll()
			}
		})
	})

	// =========================================================================
	// Default Browser Pool (singleton)
	// =========================================================================

	describe('browserPool (default singleton)', () => {
		afterEach(async () => {
			// Ensure cleanup after each test
			await browserPool.closeAll()
		})

		it('is a valid browser pool', () => {
			expect(browserPool).toBeDefined()
			expect(typeof browserPool.acquire).toBe('function')
			expect(typeof browserPool.release).toBe('function')
			expect(typeof browserPool.closeAll).toBe('function')
			expect(typeof browserPool.stats).toBe('function')
		})

		it('acquire returns a browser', async () => {
			const browser = await browserPool.acquire()
			expect(browser).toBeDefined()
			expect(browser.isConnected()).toBe(true)
		})

		it('closeAll cleans up', async () => {
			await browserPool.acquire()
			expect(browserPool.stats().total).toBe(4)

			await browserPool.closeAll()
			expect(browserPool.stats().total).toBe(0)
		})
	})
})
