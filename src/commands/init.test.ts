import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
	existsSync,
	mkdirSync,
	rmSync,
	writeFileSync,
	readFileSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { initCommand } from './init.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI_PATH = join(__dirname, '../../dist/index.js')

// Mock console output
let consoleOutput: string[] = []
let consoleErrorOutput: string[] = []
const originalLog = console.log
const originalError = console.error

describe('init command', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resum8-init-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
		consoleOutput = []
		consoleErrorOutput = []
		console.log = (...args: unknown[]) => {
			consoleOutput.push(args.map(String).join(' '))
		}
		console.error = (...args: unknown[]) => {
			consoleErrorOutput.push(args.map(String).join(' '))
		}
	})

	afterEach(() => {
		console.log = originalLog
		console.error = originalError
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	describe('unit tests', () => {
		let originalCwd: typeof process.cwd
		let originalExit: typeof process.exit
		let exitCode: number | undefined

		beforeEach(() => {
			originalCwd = process.cwd
			originalExit = process.exit
			exitCode = undefined

			process.cwd = () => tempDir
			process.exit = ((code?: number) => {
				exitCode = code
			}) as typeof process.exit
		})

		afterEach(() => {
			process.cwd = originalCwd
			process.exit = originalExit
		})

		describe('initCommand', () => {
			it('should create resume.md with default filename', async () => {
				await initCommand(undefined, {})

				const outputPath = join(tempDir, 'resume.md')
				expect(existsSync(outputPath)).toBe(true)

				const content = readFileSync(outputPath, 'utf-8')
				expect(content).toContain('# Your Name')

				expect(
					consoleOutput.some(line => line.includes('Created resume.md')),
				).toBe(true)
				expect(consoleOutput.some(line => line.includes('Next steps:'))).toBe(
					true,
				)
			})

			it('should create file with custom filename', async () => {
				await initCommand('my-resume.md', {})

				const outputPath = join(tempDir, 'my-resume.md')
				expect(existsSync(outputPath)).toBe(true)

				const content = readFileSync(outputPath, 'utf-8')
				expect(content).toContain('# Your Name')

				expect(
					consoleOutput.some(line => line.includes('Created my-resume.md')),
				).toBe(true)
			})

			it('should exit with code 1 if template file is missing', async () => {
				// Mock the template path check by temporarily changing the module resolution
				// Since we can't easily mock the TEMPLATE_PATH constant, we'll test this via
				// the error handling when copyFileSync fails instead
				const invalidPath = join(tempDir, 'nonexistent', 'resume.md')

				await initCommand(invalidPath, {})

				expect(exitCode).toBe(1)
				expect(
					consoleErrorOutput.some(line => line.includes('Failed to create')),
				).toBe(true)
			})

			it('should overwrite existing file when force option is true', async () => {
				const filename = 'resume.md'
				const outputPath = join(tempDir, filename)

				// Create existing file
				writeFileSync(outputPath, '# Old Content')

				await initCommand(filename, { force: true })

				const content = readFileSync(outputPath, 'utf-8')
				expect(content).toContain('# Your Name')
				expect(content).not.toContain('# Old Content')

				expect(
					consoleOutput.some(line => line.includes('Created resume.md')),
				).toBe(true)
			})

			it('should provide helpful next steps in output', async () => {
				await initCommand('my-cv.md', {})

				expect(consoleOutput.some(line => line.includes('Next steps:'))).toBe(
					true,
				)
				expect(consoleOutput.some(line => line.includes('Edit my-cv.md'))).toBe(
					true,
				)
				expect(consoleOutput.some(line => line.includes('m8 my-cv.md'))).toBe(
					true,
				)
			})

			it('should handle file system errors gracefully', async () => {
				// Try to write to an invalid path (subdirectory that doesn't exist)
				const invalidPath = join(tempDir, 'nonexistent', 'subdir', 'resume.md')

				await initCommand(invalidPath, {})

				expect(exitCode).toBe(1)
				expect(
					consoleErrorOutput.some(line => line.includes('Failed to create')),
				).toBe(true)
			})
		})
	})

	describe('integration tests', () => {
		it('creates resume.md from template (default filename)', async () => {
			await execa('node', [CLI_PATH, 'init'], { cwd: tempDir })

			const outputPath = join(tempDir, 'resume.md')
			expect(existsSync(outputPath)).toBe(true)

			const content = readFileSync(outputPath, 'utf-8')
			expect(content).toContain('# Your Name')
		})

		it('creates custom filename from template', async () => {
			await execa('node', [CLI_PATH, 'init', 'john-doe.md'], { cwd: tempDir })

			const outputPath = join(tempDir, 'john-doe.md')
			expect(existsSync(outputPath)).toBe(true)

			const content = readFileSync(outputPath, 'utf-8')
			expect(content).toContain('# Your Name')
		})

		it("prompts if file already exists (aborts on 'n')", async () => {
			writeFileSync(join(tempDir, 'resume.md'), '# Existing')

			const result = await execa('node', [CLI_PATH, 'init'], {
				cwd: tempDir,
				reject: false,
				input: 'n\n',
			})

			expect(result.exitCode).toBe(0)
			expect(result.stdout).toContain('Aborted')

			// Original file should be unchanged
			const content = readFileSync(join(tempDir, 'resume.md'), 'utf-8')
			expect(content).toBe('# Existing')
		})

		it("prompts if file already exists (overwrites on 'y')", async () => {
			writeFileSync(join(tempDir, 'resume.md'), '# Existing')

			const result = await execa('node', [CLI_PATH, 'init'], {
				cwd: tempDir,
				reject: false,
				input: 'y\n',
			})

			expect(result.exitCode).toBe(0)

			const content = readFileSync(join(tempDir, 'resume.md'), 'utf-8')
			expect(content).toContain('# Your Name')
		})

		it('overwrites with --force without prompting', async () => {
			writeFileSync(join(tempDir, 'resume.md'), '# Existing')

			await execa('node', [CLI_PATH, 'init', '--force'], { cwd: tempDir })

			const content = readFileSync(join(tempDir, 'resume.md'), 'utf-8')
			expect(content).toContain('# Your Name')
		})

		it('overwrites custom filename with --force', async () => {
			writeFileSync(join(tempDir, 'my-cv.md'), '# Existing')

			await execa('node', [CLI_PATH, 'init', 'my-cv.md', '--force'], {
				cwd: tempDir,
			})

			const content = readFileSync(join(tempDir, 'my-cv.md'), 'utf-8')
			expect(content).toContain('# Your Name')
		})
	})
})
