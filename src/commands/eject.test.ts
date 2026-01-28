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

// Mock console output
let consoleOutput: string[] = []
const originalLog = console.log
const originalError = console.error

describe('eject command', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resum8-eject-test-${Date.now()}`)
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

	describe('when ejecting a bundled style', () => {
		it('should copy the classic style to local styles directory by default', async () => {
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

			const localPath = join(tempDir, 'styles', 'classic.css')
			expect(existsSync(localPath)).toBe(true)
			expect(exitCode).toBeUndefined()

			const output = consoleOutput.join('\n')
			expect(output).toContain('Ejected classic style')
			expect(output).toContain('styles/classic.css') // Relative path is shown
		})

		it('should copy the specified bundled style to local styles directory', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand('formal', {})

			process.cwd = originalCwd
			process.exit = originalExit

			const localPath = join(tempDir, 'styles', 'formal.css')
			expect(existsSync(localPath)).toBe(true)
			expect(exitCode).toBeUndefined()

			const output = consoleOutput.join('\n')
			expect(output).toContain('Ejected formal style')
		})

		it('should create the styles directory if it does not exist', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			const stylesDir = join(tempDir, 'styles')
			expect(existsSync(stylesDir)).toBe(false)

			await ejectCommand('classic', {})

			expect(existsSync(stylesDir)).toBe(true)

			process.cwd = originalCwd
			process.exit = originalExit
		})

		it('should show usage instructions after successful ejection', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			await ejectCommand('minimal', {})

			process.cwd = originalCwd
			process.exit = originalExit

			const output = consoleOutput.join('\n')
			expect(output).toContain('The local copy will now be used')
			expect(output).toContain('m8 resume.md --style minimal')
			expect(output).toContain('Edit the CSS to customize')
		})
	})

	describe('when the style file already exists', () => {
		it('should fail without --force flag', async () => {
			// Create a pre-existing local style in a fresh temp dir
			const stylesDir = join(tempDir, 'styles')
			mkdirSync(stylesDir, { recursive: true })
			const existingContent = '/* existing style */'
			writeFileSync(join(stylesDir, 'classic.css'), existingContent)

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
			await expect(ejectCommand('classic', {})).rejects.toThrow(
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
				join(tempDir, 'styles', 'classic.css'),
				'utf-8',
			)
			expect(content).toBe(existingContent)
		})

		it('should overwrite with --force flag', async () => {
			// Create a pre-existing local style in a fresh temp dir
			const stylesDir = join(tempDir, 'styles')
			mkdirSync(stylesDir, { recursive: true })
			const existingContent = '/* existing style */'
			writeFileSync(join(stylesDir, 'classic.css'), existingContent)

			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			process.exit = ((code: number) => {
				exitCode = code
			}) as typeof process.exit

			await ejectCommand('classic', { force: true })

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBeUndefined()

			const output = consoleOutput.join('\n')
			expect(output).toContain('Ejected classic style')

			// Verify the file was overwritten
			const content = readFileSync(
				join(tempDir, 'styles', 'classic.css'),
				'utf-8',
			)
			expect(content).not.toBe(existingContent)
			expect(content.length).toBeGreaterThan(0)
		})
	})

	describe('when the style name is invalid', () => {
		it('should fail and show available styles', async () => {
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
			expect(output).toContain('is not a bundled style')
			expect(output).toContain('Available styles')
			expect(output).toContain('classic')
			expect(output).toContain('formal')
			expect(output).toContain('minimal')
		})
	})

	describe('when file system operations fail', () => {
		it('should handle errors when bundled style is missing', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit
			let exitCode: number | undefined

			process.cwd = () => tempDir
			// Make process.exit throw to stop execution
			process.exit = ((code: number) => {
				exitCode = code
				throw new Error(`process.exit: ${code}`)
			}) as typeof process.exit

			// Try to eject a style that doesn't exist in bundled styles
			await expect(ejectCommand('thisIsNotABundledStyle', {})).rejects.toThrow(
				'process.exit: 1',
			)

			process.cwd = originalCwd
			process.exit = originalExit

			expect(exitCode).toBe(1)

			const output = consoleOutput.join('\n')
			expect(output).toContain('is not a bundled style')
		})
	})

	describe('edge cases', () => {
		it('should handle all bundled styles', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			const styles = ['classic', 'formal', 'minimal']

			for (const style of styles) {
				consoleOutput = []
				await ejectCommand(style, {})

				const localPath = join(tempDir, 'styles', `${style}.css`)
				expect(existsSync(localPath)).toBe(true)

				const output = consoleOutput.join('\n')
				expect(output).toContain(`Ejected ${style} style`)
			}

			process.cwd = originalCwd
			process.exit = originalExit
		})

		it('should preserve directory structure when styles dir already exists with other files', async () => {
			const originalCwd = process.cwd
			const originalExit = process.exit

			// Create styles directory with another file
			const stylesDir = join(tempDir, 'styles')
			mkdirSync(stylesDir, { recursive: true })
			writeFileSync(join(stylesDir, 'custom.css'), '/* custom style */')

			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			await ejectCommand('classic', {})

			process.cwd = originalCwd
			process.exit = originalExit

			// Both files should exist
			expect(existsSync(join(stylesDir, 'custom.css'))).toBe(true)
			expect(existsSync(join(stylesDir, 'classic.css'))).toBe(true)
		})
	})
})
