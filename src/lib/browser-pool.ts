/**
 * Browser Pool Module
 * Manages a pool of Playwright browser instances for parallel PDF rendering
 */

import { chromium, type Browser } from 'playwright'

/** Browser pool interface */
export interface BrowserPool {
	/** Acquire a browser from the pool (waits if all browsers are in use) */
	acquire(): Promise<Browser>
	/** Release a browser back to the pool */
	release(browser: Browser): void
	/** Close all browsers in the pool */
	closeAll(): Promise<void>
	/** Get pool statistics */
	stats(): { total: number; available: number; inUse: number }
}

/**
 * Create a browser pool with a fixed number of browser instances
 */
export function createBrowserPool(size: number = 4): BrowserPool {
	const browsers: Browser[] = []
	const availableBrowsers: Browser[] = []
	const pendingRequests: Array<(browser: Browser) => void> = []
	let isClosing = false

	async function launchBrowser(): Promise<Browser> {
		try {
			return await chromium.launch({ headless: true })
		} catch {
			throw new Error(
				'Chromium not found. Please run: npx playwright install chromium',
			)
		}
	}

	async function ensurePoolInitialized(): Promise<void> {
		if (browsers.length > 0) return

		// Launch all browsers in parallel
		const browserPromises = Array.from({ length: size }, () => launchBrowser())
		const launchedBrowsers = await Promise.all(browserPromises)

		browsers.push(...launchedBrowsers)
		availableBrowsers.push(...launchedBrowsers)
	}

	return {
		async acquire(): Promise<Browser> {
			if (isClosing) {
				throw new Error('Browser pool is closing')
			}

			await ensurePoolInitialized()

			// If there's an available browser, return it immediately
			const browser = availableBrowsers.shift()
			if (browser) {
				return browser
			}

			// Otherwise, wait for a browser to be released
			return new Promise<Browser>(resolve => {
				pendingRequests.push(resolve)
			})
		},

		release(browser: Browser): void {
			// If there are pending requests, fulfill the next one
			const nextRequest = pendingRequests.shift()
			if (nextRequest) {
				nextRequest(browser)
				return
			}

			// Otherwise, return to available pool
			availableBrowsers.push(browser)
		},

		async closeAll(): Promise<void> {
			isClosing = true

			// Close all browsers in parallel
			await Promise.all(browsers.map(browser => browser.close()))

			browsers.length = 0
			availableBrowsers.length = 0
			pendingRequests.length = 0
			isClosing = false
		},

		stats() {
			return {
				total: browsers.length,
				available: availableBrowsers.length,
				inUse: browsers.length - availableBrowsers.length,
			}
		},
	}
}

/**
 * Default browser pool instance (4 browsers)
 * Used by the CLI and render functions for parallel rendering
 */
export const browserPool = createBrowserPool(4)

/**
 * Register process cleanup handlers for graceful shutdown
 * Call this once at application startup if you want automatic cleanup
 */
export function registerCleanupHandlers(): void {
	process.on('SIGINT', async () => {
		await browserPool.closeAll()
		process.exit(0)
	})

	process.on('SIGTERM', async () => {
		await browserPool.closeAll()
		process.exit(0)
	})
}

// Auto-register cleanup handlers for CLI usage
registerCleanupHandlers()
