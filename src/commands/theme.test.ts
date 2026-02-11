import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { themeCommand } from './theme.js'
import { createConfigStore } from '../lib/config.js'

// Mock console.log to capture output
let consoleOutput: string[] = []
const originalLog = console.log
const originalError = console.error

/** Thrown when process.exit is mocked so the test runner doesn't actually exit. */
class ExitError extends Error {
	constructor(public readonly code: number) {
		super(`process.exit(${code})`)
		this.name = 'ExitError'
	}
}

/**
 * Mock process.exit to throw ExitError(code) instead of exiting.
 * Execution stops at the first exit call; no fall-through.
 * Returns a restorer; call it in finally or after the test.
 */
function withExitThrowing(): () => void {
	const originalExit = process.exit
	process.exit = ((code?: number) => {
		throw new ExitError(code ?? 0)
	}) as typeof process.exit
	return () => {
		process.exit = originalExit
	}
}

/**
 * Local CSS fixture with known variables.
 * Written to tempDir/themes/<name>.css so theme resolution picks it up
 * as a local theme — isolates tests from bundled theme names.
 */
const MOCK_CLASSIC_CSS = `
:root {
	--font-family: 'Times New Roman', serif;
	--font-size: 11pt;
	--section-header-color: #333;
	--link-color: #0563bb;
}
`

const MOCK_FORMAL_CSS = `
:root {
	--font-family: 'Palatino Linotype', serif;
	--font-size: 10pt;
	--section-header-color: #c43218;
}
`

/** Write a mock CSS into tempDir so `resolveTheme(name, tempDir)` finds it. */
function writeMockTheme(
	tempDir: string,
	name = 'classic',
	css = MOCK_CLASSIC_CSS,
) {
	const themesDir = join(tempDir, 'themes')
	mkdirSync(themesDir, { recursive: true })
	writeFileSync(join(themesDir, `${name}.css`), css)
}

describe('theme command', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resum8-theme-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
		consoleOutput = []
		console.log = (...args: unknown[]) => {
			consoleOutput.push(args.map(String).join(' '))
		}
		console.error = (...args: unknown[]) => {
			consoleOutput.push(args.map(String).join(' '))
		}
	})

	afterEach(() => {
		console.log = originalLog
		console.error = originalError
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	describe('theme info', () => {
		let globalConfigDir: string

		beforeEach(() => {
			globalConfigDir = join(tempDir, '.config', 'resum8')
			mkdirSync(globalConfigDir, { recursive: true })
		})

		it('shows configurable variables for a theme', async () => {
			writeMockTheme(tempDir)
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			const store = createConfigStore(globalConfigDir)
			await themeCommand('classic', {}, store)

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			expect(output).toContain('classic')
			expect(output).toContain('font-family')
			expect(output).toContain('font-size')
			expect(output).toContain('section-header-color')
		})

		it('shows variables for formal theme including section-header-color', async () => {
			writeMockTheme(tempDir, 'formal', MOCK_FORMAL_CSS)
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			const store = createConfigStore(globalConfigDir)
			await themeCommand('formal', {}, store)

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			expect(output).toContain('formal')
			expect(output).toContain('section-header-color')
		})

		it('shows usage hint for --var flag', async () => {
			writeMockTheme(tempDir)
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			const store = createConfigStore(globalConfigDir)
			await themeCommand('classic', {}, store)

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			expect(output).toContain('--var')
		})

		it('shows error for non-existent theme', async () => {
			const originalCwd = process.cwd
			process.cwd = () => tempDir
			const restoreExit = withExitThrowing()
			try {
				const store = createConfigStore(globalConfigDir)
				await expect(
					themeCommand('nonexistent', {}, store),
				).rejects.toMatchObject({ name: 'ExitError', code: 1 })
				const output = consoleOutput.join('\n')
				expect(output).toContain('not found')
			} finally {
				restoreExit()
				process.cwd = originalCwd
			}
		})
	})

	describe('setting default variables with --var', () => {
		let globalConfigDir: string

		beforeEach(() => {
			globalConfigDir = join(tempDir, '.config', 'resum8')
			mkdirSync(globalConfigDir, { recursive: true })
		})

		it('saves variable override for a theme', async () => {
			writeMockTheme(tempDir)
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			const store = createConfigStore(globalConfigDir)
			await themeCommand(
				'classic',
				{
					var: ['font-family=Arial'],
				},
				store,
			)

			process.cwd = originalCwd

			expect(store.store.themeVariables?.classic?.['font-family']).toBe('Arial')
		})

		it('saves multiple variable overrides', async () => {
			writeMockTheme(tempDir)
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			const store = createConfigStore(globalConfigDir)
			await themeCommand(
				'classic',
				{
					var: ['font-family=Arial', 'text-color=#000'],
				},
				store,
			)

			process.cwd = originalCwd

			expect(store.store.themeVariables?.classic).toEqual({
				'font-family': 'Arial',
				'text-color': '#000',
			})
		})

		it('shows confirmation after saving variables', async () => {
			writeMockTheme(tempDir)
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			const store = createConfigStore(globalConfigDir)
			await themeCommand(
				'classic',
				{
					var: ['font-family=Arial'],
				},
				store,
			)

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			expect(output).toContain('font-family')
			expect(output).toContain('Arial')
		})

		it('shows error when setting var without theme name', async () => {
			const originalCwd = process.cwd
			process.cwd = () => tempDir
			const restoreExit = withExitThrowing()
			try {
				const store = createConfigStore(globalConfigDir)
				await expect(
					themeCommand(
						undefined,
						{
							var: ['font-family=Arial'],
						},
						store,
					),
				).rejects.toMatchObject({ name: 'ExitError', code: 1 })
				const output = consoleOutput.join('\n')
				expect(output).toContain('theme name')
			} finally {
				restoreExit()
				process.cwd = originalCwd
			}
		})

		it('shows saved overrides inline with default values', async () => {
			writeMockTheme(tempDir)
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			// First, set some variables
			const store = createConfigStore(globalConfigDir)
			store.setThemeVariables('classic', {
				'font-family': 'Arial',
				'text-color': '#333',
			})

			// Then view theme info
			await themeCommand('classic', {}, store)

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			// Should show override inline with arrow indicator
			expect(output).toContain('font-family')
			expect(output).toContain('Arial')
			expect(output).toContain('→') // Arrow indicating override
		})

		it('does not show arrow when override value equals default', async () => {
			writeMockTheme(tempDir)
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			// Set a variable to the same value as its default in MOCK_CLASSIC_CSS
			const store = createConfigStore(globalConfigDir)
			store.setThemeVariables('classic', { 'font-size': '11pt' })

			// Then view theme info
			await themeCommand('classic', {}, store)

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			const lines = output.split('\n')

			// Find the font-size line
			const fontSizeIndex = lines.findIndex(line => line.includes('font-size'))
			expect(fontSizeIndex).toBeGreaterThan(-1)

			// The next line should NOT contain an arrow
			const valueLine = lines[fontSizeIndex + 1]
			expect(valueLine).not.toContain('→')
			expect(valueLine).toContain('11pt')
		})
	})

	describe('resetting variables', () => {
		let globalConfigDir: string

		beforeEach(() => {
			globalConfigDir = join(tempDir, '.config', 'resum8')
			mkdirSync(globalConfigDir, { recursive: true })
		})

		describe('--reset-all', () => {
			it('clears all variable overrides for a theme', async () => {
				writeMockTheme(tempDir)
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				// First, set some variables
				const store = createConfigStore(globalConfigDir)
				store.setThemeVariables('classic', {
					'font-family': 'Arial',
					'text-color': '#333',
				})

				// Then reset them
				await themeCommand(
					'classic',
					{
						resetAll: true,
					},
					store,
				)

				process.cwd = originalCwd

				expect(store.store.themeVariables?.classic).toBeUndefined()
			})

			it('shows confirmation after resetting all variables', async () => {
				writeMockTheme(tempDir)
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				// First, set some variables
				const store = createConfigStore(globalConfigDir)
				store.setThemeVariables('classic', { 'font-family': 'Arial' })

				// Then reset them
				await themeCommand(
					'classic',
					{
						resetAll: true,
					},
					store,
				)

				process.cwd = originalCwd

				const output = consoleOutput.join('\n')
				expect(output).toContain('cleared')
				expect(output).toContain('classic')
			})

			it('shows error when resetting all without theme name', async () => {
				const originalCwd = process.cwd
				process.cwd = () => tempDir
				const restoreExit = withExitThrowing()
				try {
					const store = createConfigStore(globalConfigDir)
					await expect(
						themeCommand(
							undefined,
							{
								resetAll: true,
							},
							store,
						),
					).rejects.toMatchObject({ name: 'ExitError', code: 1 })
					const output = consoleOutput.join('\n')
					expect(output).toContain('theme name')
				} finally {
					restoreExit()
					process.cwd = originalCwd
				}
			})

			it('does not affect other themes when resetting all', async () => {
				writeMockTheme(tempDir)
				writeMockTheme(tempDir, 'formal', MOCK_FORMAL_CSS)
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				// Set variables for multiple themes
				const store = createConfigStore(globalConfigDir)
				store.setThemeVariables('classic', { 'font-family': 'Arial' })
				store.setThemeVariables('formal', { 'font-family': 'Times' })

				// Reset only classic
				await themeCommand(
					'classic',
					{
						resetAll: true,
					},
					store,
				)

				process.cwd = originalCwd

				expect(store.store.themeVariables?.classic).toBeUndefined()
				expect(store.store.themeVariables?.formal).toEqual({
					'font-family': 'Times',
				})
			})
		})

		describe('--reset <variable>', () => {
			it('clears a specific variable override', async () => {
				writeMockTheme(tempDir)
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				// First, set multiple variables
				const store = createConfigStore(globalConfigDir)
				store.setThemeVariables('classic', {
					'font-family': 'Arial',
					'text-color': '#333',
					'base-font-size': '12pt',
				})

				// Reset only font-family
				await themeCommand(
					'classic',
					{
						reset: 'font-family',
					},
					store,
				)

				process.cwd = originalCwd

				expect(store.store.themeVariables?.classic).toEqual({
					'text-color': '#333',
					'base-font-size': '12pt',
				})
			})

			it('removes theme entry when resetting the last variable', async () => {
				writeMockTheme(tempDir)
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				// Set only one variable
				const store = createConfigStore(globalConfigDir)
				store.setThemeVariables('classic', { 'font-family': 'Arial' })

				// Reset it
				await themeCommand(
					'classic',
					{
						reset: 'font-family',
					},
					store,
				)

				process.cwd = originalCwd

				expect(store.store.themeVariables?.classic).toBeUndefined()
			})

			it('shows error when resetting non-existent override', async () => {
				writeMockTheme(tempDir)
				const originalCwd = process.cwd
				process.cwd = () => tempDir
				const restoreExit = withExitThrowing()
				try {
					const store = createConfigStore(globalConfigDir)
					store.setThemeVariables('classic', { 'font-family': 'Arial' })
					await expect(
						themeCommand(
							'classic',
							{
								reset: 'text-color',
							},
							store,
						),
					).rejects.toMatchObject({ name: 'ExitError', code: 1 })
					const output = consoleOutput.join('\n')
					expect(output).toContain('No override found')
					expect(output).toContain('text-color')
				} finally {
					restoreExit()
					process.cwd = originalCwd
				}
			})

			it('shows confirmation after resetting specific variable', async () => {
				writeMockTheme(tempDir)
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				const store = createConfigStore(globalConfigDir)
				store.setThemeVariables('classic', {
					'font-family': 'Arial',
					'text-color': '#333',
				})

				await themeCommand(
					'classic',
					{
						reset: 'font-family',
					},
					store,
				)

				process.cwd = originalCwd

				const output = consoleOutput.join('\n')
				expect(output).toContain('cleared')
				expect(output).toContain('font-family')
			})

			it('shows error when resetting without theme name', async () => {
				const originalCwd = process.cwd
				process.cwd = () => tempDir
				const restoreExit = withExitThrowing()
				try {
					const store = createConfigStore(globalConfigDir)
					await expect(
						themeCommand(
							undefined,
							{
								reset: 'font-family',
							},
							store,
						),
					).rejects.toMatchObject({ name: 'ExitError', code: 1 })
					const output = consoleOutput.join('\n')
					expect(output).toContain('theme name')
				} finally {
					restoreExit()
					process.cwd = originalCwd
				}
			})
		})
	})
})
