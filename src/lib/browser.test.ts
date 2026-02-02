import { describe, it, expect, afterEach } from 'vitest'
import { createBrowserManager, browserManager } from './browser.js'

describe('browser', () => {
	// =========================================================================
	// createBrowserManager Factory
	// =========================================================================

	describe('createBrowserManager', () => {
		it('creates independent browser manager instance', () => {
			const manager = createBrowserManager()
			expect(manager).toBeDefined()
			expect(typeof manager.getBrowser).toBe('function')
			expect(typeof manager.closeBrowser).toBe('function')
			expect(typeof manager.isConnected).toBe('function')
		})

		it('isConnected returns false initially', () => {
			const manager = createBrowserManager()
			expect(manager.isConnected()).toBe(false)
		})

		it('getBrowser launches and returns browser', async () => {
			const manager = createBrowserManager()

			try {
				const browser = await manager.getBrowser()
				expect(browser).toBeDefined()
				expect(browser.isConnected()).toBe(true)
				expect(manager.isConnected()).toBe(true)
			} finally {
				await manager.closeBrowser()
			}
		})

		it('getBrowser returns same browser on multiple calls', async () => {
			const manager = createBrowserManager()

			try {
				const browser1 = await manager.getBrowser()
				const browser2 = await manager.getBrowser()
				expect(browser1).toBe(browser2)
			} finally {
				await manager.closeBrowser()
			}
		})

		it('closeBrowser closes the browser', async () => {
			const manager = createBrowserManager()

			const browser = await manager.getBrowser()
			expect(browser.isConnected()).toBe(true)

			await manager.closeBrowser()
			expect(manager.isConnected()).toBe(false)
		})

		it('closeBrowser is safe to call multiple times', async () => {
			const manager = createBrowserManager()

			await manager.getBrowser()
			await manager.closeBrowser()
			await manager.closeBrowser()
			await manager.closeBrowser()

			expect(manager.isConnected()).toBe(false)
		})

		it('closeBrowser is safe to call without getBrowser', async () => {
			const manager = createBrowserManager()

			// Should not throw
			await manager.closeBrowser()
			expect(manager.isConnected()).toBe(false)
		})

		it('getBrowser works after closeBrowser', async () => {
			const manager = createBrowserManager()

			try {
				// First browser
				const browser1 = await manager.getBrowser()
				expect(browser1.isConnected()).toBe(true)

				// Close
				await manager.closeBrowser()
				expect(manager.isConnected()).toBe(false)

				// New browser
				const browser2 = await manager.getBrowser()
				expect(browser2.isConnected()).toBe(true)

				// Should be a different browser instance
				expect(browser1.isConnected()).toBe(false)
				expect(browser2.isConnected()).toBe(true)
			} finally {
				await manager.closeBrowser()
			}
		})

		it('handles concurrent getBrowser calls', async () => {
			const manager = createBrowserManager()

			try {
				// Launch multiple concurrent requests
				const [browser1, browser2, browser3] = await Promise.all([
					manager.getBrowser(),
					manager.getBrowser(),
					manager.getBrowser(),
				])

				// All should return the same browser
				expect(browser1).toBe(browser2)
				expect(browser2).toBe(browser3)
			} finally {
				await manager.closeBrowser()
			}
		})

		it('multiple managers are independent', async () => {
			const manager1 = createBrowserManager()
			const manager2 = createBrowserManager()

			try {
				const browser1 = await manager1.getBrowser()
				const browser2 = await manager2.getBrowser()

				// Different browser instances
				expect(browser1).not.toBe(browser2)
				expect(browser1.isConnected()).toBe(true)
				expect(browser2.isConnected()).toBe(true)

				// Closing one doesn't affect the other
				await manager1.closeBrowser()
				expect(manager1.isConnected()).toBe(false)
				expect(manager2.isConnected()).toBe(true)
			} finally {
				await manager1.closeBrowser()
				await manager2.closeBrowser()
			}
		})
	})

	// =========================================================================
	// Default Browser Manager (singleton)
	// =========================================================================

	describe('browserManager (default singleton)', () => {
		afterEach(async () => {
			// Ensure cleanup after each test
			await browserManager.closeBrowser()
		})

		it('is a valid browser manager', () => {
			expect(browserManager).toBeDefined()
			expect(typeof browserManager.getBrowser).toBe('function')
			expect(typeof browserManager.closeBrowser).toBe('function')
			expect(typeof browserManager.isConnected).toBe('function')
		})

		it('getBrowser returns a browser', async () => {
			const browser = await browserManager.getBrowser()
			expect(browser).toBeDefined()
			expect(browser.isConnected()).toBe(true)
		})

		it('closeBrowser cleans up', async () => {
			await browserManager.getBrowser()
			expect(browserManager.isConnected()).toBe(true)

			await browserManager.closeBrowser()
			expect(browserManager.isConnected()).toBe(false)
		})
	})
})
