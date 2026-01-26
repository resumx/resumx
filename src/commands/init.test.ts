import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI_PATH = join(__dirname, '../../dist/index.js')

describe('init command', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resum8-init-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

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
