import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	existsSync,
	mkdirSync,
	writeFileSync,
	rmSync,
	readFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { styleCommand } from './style.js'
import { readGlobalConfig, writeGlobalConfig } from '../lib/config.js'

// Mock console.log to capture output
let consoleOutput: string[] = []
const originalLog = console.log
const originalError = console.error

describe('style command', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resum8-style-test-${Date.now()}`)
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

	describe('style info', () => {
		let globalConfigDir: string

		beforeEach(() => {
			globalConfigDir = join(tempDir, '.config', 'resum8')
			mkdirSync(globalConfigDir, { recursive: true })
		})

		it('shows configurable variables for a bundled style', async () => {
			// Change cwd for the test
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			await styleCommand('classic', { _configDir: globalConfigDir })

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			expect(output).toContain('classic')
			expect(output).toContain('--font-family')
			expect(output).toContain('--base-font-size')
			expect(output).toContain('--text-color')
		})

		it('shows variables for formal style including section-header-color', async () => {
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			await styleCommand('formal', { _configDir: globalConfigDir })

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			expect(output).toContain('formal')
			expect(output).toContain('--section-header-color')
		})

		it('shows usage hint for --var flag', async () => {
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			await styleCommand('classic', { _configDir: globalConfigDir })

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			expect(output).toContain('--var')
		})

		it('shows error for non-existent style', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined
			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await styleCommand('nonexistent', { _configDir: globalConfigDir })

			process.cwd = originalCwd
			process.exit = originalExit

			const output = consoleOutput.join('\n')
			expect(output).toContain('not found')
			expect(exitCode).toBe(1)
		})
	})

	describe('setting default variables with --var', () => {
		let globalConfigDir: string

		beforeEach(() => {
			globalConfigDir = join(tempDir, '.config', 'resum8')
			mkdirSync(globalConfigDir, { recursive: true })
		})

		it('saves variable override for a style', async () => {
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			await styleCommand('classic', {
				var: ['font-family=Arial'],
				_configDir: globalConfigDir,
			})

			process.cwd = originalCwd

			const config = readGlobalConfig(globalConfigDir)
			expect(config.styleVariables?.classic?.['font-family']).toBe('Arial')
		})

		it('saves multiple variable overrides', async () => {
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			await styleCommand('classic', {
				var: ['font-family=Arial', 'text-color=#000'],
				_configDir: globalConfigDir,
			})

			process.cwd = originalCwd

			const config = readGlobalConfig(globalConfigDir)
			expect(config.styleVariables?.classic).toEqual({
				'font-family': 'Arial',
				'text-color': '#000',
			})
		})

		it('shows confirmation after saving variables', async () => {
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			await styleCommand('classic', {
				var: ['font-family=Arial'],
				_configDir: globalConfigDir,
			})

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			expect(output).toContain('font-family')
			expect(output).toContain('Arial')
		})

		it('shows error when setting var without style name', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined
			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await styleCommand(undefined, {
				var: ['font-family=Arial'],
				_configDir: globalConfigDir,
			})

			process.cwd = originalCwd
			process.exit = originalExit

			const output = consoleOutput.join('\n')
			expect(output).toContain('style name')
			expect(exitCode).toBe(1)
		})

		it('shows saved overrides inline with default values', async () => {
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			// First, set some variables
			writeGlobalConfig(
				{
					styleVariables: {
						classic: { 'font-family': 'Arial', 'text-color': '#333' },
					},
				},
				globalConfigDir,
			)

			// Then view style info
			await styleCommand('classic', { _configDir: globalConfigDir })

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			// Should show override inline with arrow indicator
			expect(output).toContain('font-family')
			expect(output).toContain('Arial')
			expect(output).toContain('→') // Arrow indicating override
		})

		it('does not show arrow when override value equals default', async () => {
			const originalCwd = process.cwd
			process.cwd = () => tempDir

			// Set a variable to the same value as its default
			writeGlobalConfig(
				{
					styleVariables: {
						classic: { 'text-color': '#222' }, // Same as default in classic.css
					},
				},
				globalConfigDir,
			)

			// Then view style info
			await styleCommand('classic', { _configDir: globalConfigDir })

			process.cwd = originalCwd

			const output = consoleOutput.join('\n')
			const lines = output.split('\n')

			// Find the text-color line
			const textColorIndex = lines.findIndex(line =>
				line.includes('--text-color'),
			)
			expect(textColorIndex).toBeGreaterThan(-1)

			// The next line should NOT contain an arrow
			const valueLine = lines[textColorIndex + 1]
			expect(valueLine).not.toContain('→')
			expect(valueLine).toContain('#222')
		})
	})

	describe('resetting variables', () => {
		let globalConfigDir: string

		beforeEach(() => {
			globalConfigDir = join(tempDir, '.config', 'resum8')
			mkdirSync(globalConfigDir, { recursive: true })
		})

		describe('--reset-all', () => {
			it('clears all variable overrides for a style', async () => {
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				// First, set some variables
				writeGlobalConfig(
					{
						styleVariables: {
							classic: { 'font-family': 'Arial', 'text-color': '#333' },
						},
					},
					globalConfigDir,
				)

				// Then reset them
				await styleCommand('classic', {
					resetAll: true,
					_configDir: globalConfigDir,
				})

				process.cwd = originalCwd

				const config = readGlobalConfig(globalConfigDir)
				expect(config.styleVariables?.classic).toBeUndefined()
			})

			it('shows confirmation after resetting all variables', async () => {
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				// First, set some variables
				writeGlobalConfig(
					{
						styleVariables: {
							classic: { 'font-family': 'Arial' },
						},
					},
					globalConfigDir,
				)

				// Then reset them
				await styleCommand('classic', {
					resetAll: true,
					_configDir: globalConfigDir,
				})

				process.cwd = originalCwd

				const output = consoleOutput.join('\n')
				expect(output).toContain('cleared')
				expect(output).toContain('classic')
			})

			it('shows error when resetting all without style name', async () => {
				const originalCwd = process.cwd
				const originalExit = process.exit
				let exitCode: number | undefined
				process.cwd = () => tempDir
				process.exit = ((code: number) => {
					exitCode = code
				}) as typeof process.exit

				await styleCommand(undefined, {
					resetAll: true,
					_configDir: globalConfigDir,
				})

				process.cwd = originalCwd
				process.exit = originalExit

				const output = consoleOutput.join('\n')
				expect(output).toContain('style name')
				expect(exitCode).toBe(1)
			})

			it('does not affect other styles when resetting all', async () => {
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				// Set variables for multiple styles
				writeGlobalConfig(
					{
						styleVariables: {
							classic: { 'font-family': 'Arial' },
							formal: { 'font-family': 'Times' },
						},
					},
					globalConfigDir,
				)

				// Reset only classic
				await styleCommand('classic', {
					resetAll: true,
					_configDir: globalConfigDir,
				})

				process.cwd = originalCwd

				const config = readGlobalConfig(globalConfigDir)
				expect(config.styleVariables?.classic).toBeUndefined()
				expect(config.styleVariables?.formal).toEqual({
					'font-family': 'Times',
				})
			})
		})

		describe('--reset <variable>', () => {
			it('clears a specific variable override', async () => {
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				// First, set multiple variables
				writeGlobalConfig(
					{
						styleVariables: {
							classic: {
								'font-family': 'Arial',
								'text-color': '#333',
								'base-font-size': '12pt',
							},
						},
					},
					globalConfigDir,
				)

				// Reset only font-family
				await styleCommand('classic', {
					reset: 'font-family',
					_configDir: globalConfigDir,
				})

				process.cwd = originalCwd

				const config = readGlobalConfig(globalConfigDir)
				expect(config.styleVariables?.classic).toEqual({
					'text-color': '#333',
					'base-font-size': '12pt',
				})
			})

			it('removes style entry when resetting the last variable', async () => {
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				// Set only one variable
				writeGlobalConfig(
					{
						styleVariables: {
							classic: { 'font-family': 'Arial' },
						},
					},
					globalConfigDir,
				)

				// Reset it
				await styleCommand('classic', {
					reset: 'font-family',
					_configDir: globalConfigDir,
				})

				process.cwd = originalCwd

				const config = readGlobalConfig(globalConfigDir)
				expect(config.styleVariables?.classic).toBeUndefined()
			})

			it('shows error when resetting non-existent override', async () => {
				const originalCwd = process.cwd
				const originalExit = process.exit
				let exitCode: number | undefined
				process.cwd = () => tempDir
				process.exit = ((code: number) => {
					exitCode = code
				}) as typeof process.exit

				// Set some variables but not the one we'll try to reset
				writeGlobalConfig(
					{
						styleVariables: {
							classic: { 'font-family': 'Arial' },
						},
					},
					globalConfigDir,
				)

				await styleCommand('classic', {
					reset: 'text-color',
					_configDir: globalConfigDir,
				})

				process.cwd = originalCwd
				process.exit = originalExit

				const output = consoleOutput.join('\n')
				expect(output).toContain('No override found')
				expect(output).toContain('text-color')
				expect(exitCode).toBe(1)
			})

			it('shows confirmation after resetting specific variable', async () => {
				const originalCwd = process.cwd
				process.cwd = () => tempDir

				writeGlobalConfig(
					{
						styleVariables: {
							classic: { 'font-family': 'Arial', 'text-color': '#333' },
						},
					},
					globalConfigDir,
				)

				await styleCommand('classic', {
					reset: 'font-family',
					_configDir: globalConfigDir,
				})

				process.cwd = originalCwd

				const output = consoleOutput.join('\n')
				expect(output).toContain('cleared')
				expect(output).toContain('font-family')
			})

			it('shows error when resetting without style name', async () => {
				const originalCwd = process.cwd
				const originalExit = process.exit
				let exitCode: number | undefined
				process.cwd = () => tempDir
				process.exit = ((code: number) => {
					exitCode = code
				}) as typeof process.exit

				await styleCommand(undefined, {
					reset: 'font-family',
					_configDir: globalConfigDir,
				})

				process.cwd = originalCwd
				process.exit = originalExit

				const output = consoleOutput.join('\n')
				expect(output).toContain('style name')
				expect(exitCode).toBe(1)
			})
		})
	})
})
