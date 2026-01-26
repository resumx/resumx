import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
	existsSync,
	mkdirSync,
	rmSync,
	readFileSync,
	writeFileSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI_PATH = join(__dirname, '../../dist/index.js')

describe('eject command', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resum8-eject-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	it('ejects default style (classic)', async () => {
		await execa('node', [CLI_PATH, 'eject'], { cwd: tempDir })

		const outputPath = join(tempDir, 'styles/classic.css')
		expect(existsSync(outputPath)).toBe(true)

		const content = readFileSync(outputPath, 'utf-8')
		expect(content).toContain('resum8')
	})

	it('ejects specified style', async () => {
		await execa('node', [CLI_PATH, 'eject', 'formal'], { cwd: tempDir })

		const outputPath = join(tempDir, 'styles/formal.css')
		expect(existsSync(outputPath)).toBe(true)
	})

	it('ejects minimal style', async () => {
		await execa('node', [CLI_PATH, 'eject', 'minimal'], { cwd: tempDir })

		const outputPath = join(tempDir, 'styles/minimal.css')
		expect(existsSync(outputPath)).toBe(true)
	})

	it('fails if style already exists locally', async () => {
		mkdirSync(join(tempDir, 'styles'))
		writeFileSync(join(tempDir, 'styles/classic.css'), '/* local */')

		const result = await execa('node', [CLI_PATH, 'eject'], {
			cwd: tempDir,
			reject: false,
		})

		expect(result.exitCode).toBe(1)
		expect(result.stderr).toContain('already exists')
	})

	it('overwrites with --force', async () => {
		mkdirSync(join(tempDir, 'styles'))
		writeFileSync(join(tempDir, 'styles/classic.css'), '/* local */')

		await execa('node', [CLI_PATH, 'eject', '--force'], { cwd: tempDir })

		const content = readFileSync(join(tempDir, 'styles/classic.css'), 'utf-8')
		expect(content).toContain('resum8')
	})

	it('fails for non-existent style', async () => {
		const result = await execa('node', [CLI_PATH, 'eject', 'nonexistent'], {
			cwd: tempDir,
			reject: false,
		})

		expect(result.exitCode).toBe(1)
		expect(result.stderr).toContain('not a bundled style')
	})
})
