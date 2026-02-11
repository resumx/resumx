import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
	existsSync,
	mkdirSync,
	writeFileSync,
	rmSync,
	readFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ejectCommand } from './eject.js'
import { getBundledThemes, DEFAULT_THEME } from '../lib/themes.js'

// Mock console output
let consoleOutput: string[] = []
const originalLog = console.log
const originalError = console.error

describe('eject command', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resumx-eject-test-${Date.now()}`)
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

	describe('when ejecting a bundled theme', () => {
		it('should copy the default theme to local themes directory by default', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand(undefined, {})

			process.cwd = originalCwd
			process.exit = originalExit

			const defaultTheme = DEFAULT_THEME
			const localPath = join(tempDir, 'themes', `${defaultTheme}.css`)
			expect(existsSync(localPath)).toBe(true)
			expect(exitCode).toBeUndefined()

			const output = consoleOutput.join('\n')
			expect(output).toContain(`Ejected ${defaultTheme} theme`)
			expect(output).toContain(`themes/${defaultTheme}.css`) // Relative path is shown
		})

		it('should copy the specified bundled theme to local themes directory', async () => {
			const bundled = getBundledThemes()
			expect(bundled.length).toBeGreaterThanOrEqual(1)
			const themeName = bundled[bundled.length - 1]! // Use last bundled theme

			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand(themeName, {})

			process.cwd = originalCwd
			process.exit = originalExit

			const localPath = join(tempDir, 'themes', `${themeName}.css`)
			expect(existsSync(localPath)).toBe(true)
			expect(exitCode).toBeUndefined()

			const output = consoleOutput.join('\n')
			expect(output).toContain(`Ejected ${themeName} theme`)
		})

		it('should preserve @import statements in ejected file instead of inlining', async () => {
			const themeName = getBundledThemes()[0]!
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			await ejectCommand(themeName, {})

			process.cwd = originalCwd
			process.exit = originalExit

			const localPath = join(tempDir, 'themes', `${themeName}.css`)
			const content = readFileSync(localPath, 'utf-8')

			// @import statements should be preserved, not inlined
			expect(content).toContain("@import 'common/base.css';")
			expect(content).toContain("@import 'common/icons.css';")
			expect(content).toContain("@import 'common/utilities.css';")

			// The ejected file should NOT contain inlined content from common files
			// (base.css defines box-sizing, icons.css defines .icon classes, etc.)
			expect(content).not.toContain('box-sizing: border-box')
		})

		it('should create the themes directory if it does not exist', async () => {
			const themeName = getBundledThemes()[0]!
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			const themesDir = join(tempDir, 'themes')
			expect(existsSync(themesDir)).toBe(false)

			await ejectCommand(themeName, {})

			expect(existsSync(themesDir)).toBe(true)

			process.cwd = originalCwd
			process.exit = originalExit
		})

		it('should show usage instructions after successful ejection', async () => {
			const themeName = getBundledThemes()[0]!
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			await ejectCommand(themeName, {})

			process.cwd = originalCwd
			process.exit = originalExit

			const output = consoleOutput.join('\n')
			expect(output).toContain('The local copy will now be used')
			expect(output).toContain(`resumx resume.md --theme ${themeName}`)
			expect(output).toContain('Edit the CSS to customize')
		})
	})

	describe('when the theme file already exists', () => {
		it('should fail without --force flag', async () => {
			const themeName = getBundledThemes()[0]!
			// Create a pre-existing local theme in a fresh temp dir
			const themesDir = join(tempDir, 'themes')
			mkdirSync(themesDir, { recursive: true })
			const existingContent = '/* existing theme */'
			writeFileSync(join(themesDir, `${themeName}.css`), existingContent)

			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			// Make process.exit throw to stop execution
			process.exit = ((code: number) => {
				exitCode = code
				throw new Error(`process.exit: ${code}`)
			}) as typeof process.exit

			// Expect the function to throw due to process.exit
			await expect(ejectCommand(themeName, {})).rejects.toThrow(
				'process.exit: 1',
			)

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBe(1)

			const output = consoleOutput.join('\n')
			expect(output).toContain('already exists')
			expect(output).toContain('Use --force to overwrite')

			// Verify the file was not overwritten
			const content = readFileSync(
				join(tempDir, 'themes', `${themeName}.css`),
				'utf-8',
			)
			expect(content).toBe(existingContent)
		})

		it('should overwrite with --force flag', async () => {
			const themeName = getBundledThemes()[0]!
			// Create a pre-existing local theme in a fresh temp dir
			const themesDir = join(tempDir, 'themes')
			mkdirSync(themesDir, { recursive: true })
			const existingContent = '/* existing theme */'
			writeFileSync(join(themesDir, `${themeName}.css`), existingContent)

			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand(themeName, { force: true })

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBeUndefined()

			const output = consoleOutput.join('\n')
			expect(output).toContain(`Ejected ${themeName} theme`)

			// Verify the file was overwritten
			const content = readFileSync(
				join(tempDir, 'themes', `${themeName}.css`),
				'utf-8',
			)
			expect(content).not.toBe(existingContent)
			expect(content.length).toBeGreaterThan(0)
		})
	})

	describe('when the theme name is invalid', () => {
		it('should fail and show available themes', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			// Make process.exit throw to stop execution
			process.exit = ((code: number) => {
				exitCode = code
				throw new Error(`process.exit: ${code}`)
			}) as typeof process.exit

			// Expect the function to throw due to process.exit
			await expect(ejectCommand('nonexistent', {})).rejects.toThrow(
				'process.exit: 1',
			)

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBe(1)

			const output = consoleOutput.join('\n')
			expect(output).toContain('nonexistent')
			expect(output).toContain('is not a bundled theme')
			expect(output).toContain('Available themes')
			// Verify all bundled themes are listed
			for (const theme of getBundledThemes()) {
				expect(output).toContain(theme)
			}
		})
	})

	describe('when file system operations fail', () => {
		it('should handle errors when bundled theme is missing', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			// Make process.exit throw to stop execution
			process.exit = ((code: number) => {
				exitCode = code
				throw new Error(`process.exit: ${code}`)
			}) as typeof process.exit

			// Try to eject a theme that doesn't exist in bundled themes
			await expect(ejectCommand('thisIsNotABundledTheme', {})).rejects.toThrow(
				'process.exit: 1',
			)

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBe(1)

			const output = consoleOutput.join('\n')
			expect(output).toContain('is not a bundled theme')
		})
	})

	describe('edge cases', () => {
		it('should handle all bundled themes', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			for (const theme of getBundledThemes()) {
				consoleOutput = []
				await ejectCommand(theme, {})

				const localPath = join(tempDir, 'themes', `${theme}.css`)
				expect(existsSync(localPath)).toBe(true)

				const output = consoleOutput.join('\n')
				expect(output).toContain(`Ejected ${theme} theme`)
			}

			process.cwd = originalCwd
			process.exit = originalExit
		})

		it('should preserve directory structure when themes dir already exists with other files', async () => {
			const themeName = getBundledThemes()[0]!
			const originalCwd = process.cwd
			const originalExit = process.exit

			// Create themes directory with another file
			const themesDir = join(tempDir, 'themes')
			mkdirSync(themesDir, { recursive: true })
			writeFileSync(join(themesDir, 'custom.css'), '/* custom theme */')

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			await ejectCommand(themeName, {})

			process.cwd = originalCwd
			process.exit = originalExit

			// Both files should exist
			expect(existsSync(join(themesDir, 'custom.css'))).toBe(true)
			expect(existsSync(join(themesDir, `${themeName}.css`))).toBe(true)
		})
	})

	describe('when ejecting common themes', () => {
		it('should eject common/base to themes/common/base.css', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand('common/base', {})

			process.cwd = originalCwd
			process.exit = originalExit

			const localPath = join(tempDir, 'themes', 'common', 'base.css')
			expect(existsSync(localPath)).toBe(true)
			expect(exitCode).toBeUndefined()

			const content = readFileSync(localPath, 'utf-8')
			expect(content.length).toBeGreaterThan(0)

			const output = consoleOutput.join('\n')
			expect(output).toContain('Ejected common/base theme')
		})

		it('should create nested common directory even when themes dir does not exist', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			const themesDir = join(tempDir, 'themes')
			const commonDir = join(themesDir, 'common')
			expect(existsSync(themesDir)).toBe(false)

			await ejectCommand('common/icons', {})

			process.cwd = originalCwd
			process.exit = originalExit

			expect(existsSync(commonDir)).toBe(true)
			expect(existsSync(join(commonDir, 'icons.css'))).toBe(true)
		})

		it('should eject all common themes individually', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			const commonThemes = ['common/base', 'common/icons', 'common/utilities']

			for (const theme of commonThemes) {
				consoleOutput = []
				await ejectCommand(theme, {})

				const localPath = join(tempDir, 'themes', `${theme}.css`)
				expect(existsSync(localPath)).toBe(true)

				const output = consoleOutput.join('\n')
				expect(output).toContain(`Ejected ${theme} theme`)
			}

			process.cwd = originalCwd
			process.exit = originalExit
		})

		it('should respect --force flag for common themes', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			// Pre-create the file
			const commonDir = join(tempDir, 'themes', 'common')
			mkdirSync(commonDir, { recursive: true })
			const existingContent = '/* custom base */'
			writeFileSync(join(commonDir, 'base.css'), existingContent)

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
				throw new Error(`process.exit: ${code}`)
			}) as typeof process.exit

			// Without --force should fail
			await expect(ejectCommand('common/base', {})).rejects.toThrow(
				'process.exit: 1',
			)

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBe(1)

			// File should not be overwritten
			const content = readFileSync(join(commonDir, 'base.css'), 'utf-8')
			expect(content).toBe(existingContent)

			// With --force should succeed
			exitCode = undefined
			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand('common/base', { force: true })

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBeUndefined()
			const overwritten = readFileSync(join(commonDir, 'base.css'), 'utf-8')
			expect(overwritten).not.toBe(existingContent)
		})
	})
})
