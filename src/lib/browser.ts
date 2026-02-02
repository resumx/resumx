/**
 * Browser Manager Module
 * Manages Playwright browser lifecycle for PDF rendering
 */

import { chromium, type Browser } from 'playwright'

/** Browser manager interface for dependency injection and testing */
export interface BrowserManager {
	getBrowser(): Promise<Browser> // Get or create a browser instance. Reuses existing connected browser for faster subsequent renders
	closeBrowser(): Promise<void> // Close the browser instance. Safe to call multiple times
	isConnected(): boolean // Check if browser is currently connected
}

/**
 * Create a browser manager instance
 * Encapsulates browser singleton logic without module-level side effects
 */
export function createBrowserManager(): BrowserManager {
	let sharedBrowser: Browser | null = null
	let browserPromise: Promise<Browser> | null = null

	async function launchBrowser(): Promise<Browser> {
		try {
			return await chromium.launch({ headless: true })
		} catch {
			throw new Error(
				'Chromium not found. Please run: npx playwright install chromium',
			)
		}
	}

	return {
		async getBrowser(): Promise<Browser> {
			// Return existing browser if available and connected
			if (sharedBrowser?.isConnected()) {
				return sharedBrowser
			}

			// If browser is being launched, wait for it
			if (browserPromise) {
				return browserPromise
			}

			// Launch new browser
			browserPromise = launchBrowser()
			try {
				sharedBrowser = await browserPromise
				return sharedBrowser
			} finally {
				browserPromise = null
			}
		},

		async closeBrowser(): Promise<void> {
			if (sharedBrowser) {
				await sharedBrowser.close()
				sharedBrowser = null
			}
		},

		isConnected(): boolean {
			return sharedBrowser?.isConnected() ?? false
		},
	}
}

/**
 * Default browser manager instance
 * Used by the CLI and render functions
 */
export const browserManager = createBrowserManager()

/**
 * Register process cleanup handlers for graceful shutdown
 * Call this once at application startup if you want automatic cleanup
 */
export function registerCleanupHandlers(): void {
	process.on('exit', () => {
		// Sync close attempt on exit
		if (browserManager.isConnected()) {
			// Note: async operations may not complete on 'exit'
			browserManager.closeBrowser().catch(() => {})
		}
	})

	process.on('SIGINT', async () => {
		await browserManager.closeBrowser()
		process.exit(0)
	})

	process.on('SIGTERM', async () => {
		await browserManager.closeBrowser()
		process.exit(0)
	})
}

// Auto-register cleanup handlers for CLI usage
// This maintains backward compatibility with the original behavior
registerCleanupHandlers()
