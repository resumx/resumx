import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
	existsSync,
	mkdirSync,
	rmSync,
	copyFileSync,
	readFileSync,
	writeFileSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { createConfigStore } from '../lib/config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI_PATH = join(__dirname, '../../dist/index.js')
const FIXTURE_PATH = join(__dirname, '../../tests/fixtures/sample.md')

describe('render command', () => {
	let tempDir: string

	/**
	 * Helper to run CLI with test config directory
	 */
	const runCLI = (args: string[], options: { cwd: string; reject?: false }) => {
		return execa('node', [CLI_PATH, ...args], options)
	}

	/**
	 * Output behavior test coverage:
	 *
	 * Default behavior:
	 * - No -o flag: outputs to cwd (current working directory) with input filename
	 *
	 * Custom filename:
	 * - `-o custom`: outputs to cwd with custom name
	 *
	 * Directory paths:
	 * - `-o output/custom`: creates directory and outputs with custom name
	 * - `-o output/`: creates directory and preserves input filename (trailing slash)
	 * - Nested directories: `-o build/output/dist/final` creates all directories
	 *
	 * Extension handling:
	 * - Strips document extensions (.pdf, .html, .htm, .docx, .doc) to avoid double extensions
	 * - `-o resume.pdf --html` → resume.html (not resume.pdf.html)
	 * - Preserves non-document extensions: `-o file.backup --html` → file.backup.html
	 * - Works with directory paths: `-o dist/resume.html --pdf` → dist/resume.pdf
	 * - Works with --all flag: all formats get correct extensions
	 *
	 * Other:
	 * - Style selection
	 * - Error handling
	 * - Input filename priority over H1 heading
	 * - Argument validation
	 */

	beforeEach(() => {
		tempDir = join(tmpdir(), `resum8-render-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
		// Copy fixture to temp dir
		copyFileSync(FIXTURE_PATH, join(tempDir, 'sample.md'))

		// Set test config directory to avoid using global config
		process.env.RESUM8_CONFIG_DIR = join(tempDir, '.config', 'resum8')
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
		// Clean up test env var
		delete process.env.RESUM8_CONFIG_DIR
	})

	it('renders HTML output', async () => {
		await runCLI(['sample.md', '--html'], { cwd: tempDir })

		expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
	})

	it('renders PDF output', async () => {
		await runCLI(['sample.md', '--pdf'], {
			cwd: tempDir,
		})

		expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
	})

	it('renders all formats with --all', async () => {
		await runCLI(['sample.md', '--all'], {
			cwd: tempDir,
		})

		expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
		expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
		expect(existsSync(join(tempDir, 'sample.docx'))).toBe(true)
	})

	it('uses custom filename with -o', async () => {
		await runCLI(['sample.md', '--html', '-o', 'custom'], {
			cwd: tempDir,
		})

		// Should output in same directory with custom name
		expect(existsSync(join(tempDir, 'custom.html'))).toBe(true)
	})

	it('uses custom output directory with -o', async () => {
		await execa(
			'node',
			[CLI_PATH, 'sample.md', '--html', '-o', 'output/custom'],
			{
				cwd: tempDir,
			},
		)

		expect(existsSync(join(tempDir, 'output/custom.html'))).toBe(true)
	})

	it('uses directory path ending with slash to preserve input filename', async () => {
		await runCLI(['sample.md', '--html', '-o', 'output/'], {
			cwd: tempDir,
		})

		// Should use input filename (sample) in the specified directory
		expect(existsSync(join(tempDir, 'output/sample.html'))).toBe(true)
	})

	it('strips extension from output name to avoid double extensions', async () => {
		await runCLI(['sample.md', '--html', '-o', 'resume.pdf'], {
			cwd: tempDir,
		})

		// Should create resume.html, not resume.pdf.html
		expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)
		expect(existsSync(join(tempDir, 'resume.pdf.html'))).toBe(false)
	})

	it('strips extension from output path with directory', async () => {
		await execa(
			'node',
			[CLI_PATH, 'sample.md', '--pdf', '-o', 'dist/resume.html'],
			{
				cwd: tempDir,
			},
		)

		// Should create dist/resume.pdf, not dist/resume.html.pdf
		expect(existsSync(join(tempDir, 'dist/resume.pdf'))).toBe(true)
		expect(existsSync(join(tempDir, 'dist/resume.html.pdf'))).toBe(false)
	})

	it('handles multiple format extensions correctly', async () => {
		await execa(
			'node',
			[CLI_PATH, 'sample.md', '--all', '-o', 'myresume.pdf'],
			{
				cwd: tempDir,
			},
		)

		// All formats should use stripped name
		expect(existsSync(join(tempDir, 'myresume.html'))).toBe(true)
		expect(existsSync(join(tempDir, 'myresume.pdf'))).toBe(true)
		expect(existsSync(join(tempDir, 'myresume.docx'))).toBe(true)

		// Should not create double extensions
		expect(existsSync(join(tempDir, 'myresume.pdf.html'))).toBe(false)
		expect(existsSync(join(tempDir, 'myresume.pdf.pdf'))).toBe(false)
		expect(existsSync(join(tempDir, 'myresume.pdf.docx'))).toBe(false)
	})

	it('preserves non-document extensions in output name', async () => {
		await execa(
			'node',
			[CLI_PATH, 'sample.md', '--html', '-o', 'file.backup'],
			{
				cwd: tempDir,
			},
		)

		// Non-document extensions should be preserved
		expect(existsSync(join(tempDir, 'file.backup.html'))).toBe(true)
	})

	it('handles nested directory paths', async () => {
		await execa(
			'node',
			[CLI_PATH, 'sample.md', '--html', '-o', 'build/output/dist/final'],
			{
				cwd: tempDir,
			},
		)

		// Should create nested directories and output file
		expect(existsSync(join(tempDir, 'build/output/dist/final.html'))).toBe(true)
	})

	it('handles deeply nested directory with trailing slash', async () => {
		await runCLI(['sample.md', '--pdf', '-o', 'dist/build/'], {
			cwd: tempDir,
		})

		// Should preserve input filename in nested directory
		expect(existsSync(join(tempDir, 'dist/build/sample.pdf'))).toBe(true)
	})

	it('creates directory if output path includes directory', async () => {
		// Directory doesn't exist yet
		expect(existsSync(join(tempDir, 'build'))).toBe(false)

		await execa(
			'node',
			[CLI_PATH, 'sample.md', '--html', '-o', 'build/result'],
			{
				cwd: tempDir,
			},
		)

		// Directory should be created and file placed inside
		expect(existsSync(join(tempDir, 'build'))).toBe(true)
		expect(existsSync(join(tempDir, 'build/result.html'))).toBe(true)
	})

	it('uses specified style', async () => {
		await execa(
			'node',
			[CLI_PATH, 'sample.md', '--html', '--style', 'formal'],
			{ cwd: tempDir },
		)

		expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
	})

	it('fails gracefully with non-existent file', async () => {
		const result = await runCLI(['nonexistent.md', '--html'], {
			cwd: tempDir,
			reject: false,
		})

		expect(result.exitCode).toBe(1)
		expect(result.stderr).toContain('not found')
	})

	it('output filename follows input filename, not H1 heading', async () => {
		// Copy fixture as "my-resume.md"
		copyFileSync(FIXTURE_PATH, join(tempDir, 'my-resume.md'))

		await runCLI(['my-resume.md', '--html'], {
			cwd: tempDir,
		})

		// Should create my-resume.html, not TestPerson.html (from H1)
		expect(existsSync(join(tempDir, 'my-resume.html'))).toBe(true)
		expect(existsSync(join(tempDir, 'TestPerson.html'))).toBe(false)
	})

	describe('input file in different directories', () => {
		it('renders file from child directory when running from parent', async () => {
			// Create subdirectory and copy file there
			const subDir = join(tempDir, 'subdirectory')
			mkdirSync(subDir, { recursive: true })
			copyFileSync(FIXTURE_PATH, join(subDir, 'nested.md'))

			// Run from tempDir, reference file in subdirectory
			await runCLI(['subdirectory/nested.md', '--html'], {
				cwd: tempDir,
			})

			// Output should be in the parent directory, not subdirectory
			expect(existsSync(join(tempDir, 'nested.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'subdirectory/nested.html'))).toBe(false)
		})

		it('renders file from parent directory when running from child', async () => {
			// Create subdirectory
			const subDir = join(tempDir, 'subdirectory')
			mkdirSync(subDir, { recursive: true })

			// sample.md is in tempDir (parent), run from subDir (child)
			await runCLI(['../sample.md', '--html'], {
				cwd: subDir,
			})

			// Output should be in the sub directory, not parent directory
			expect(existsSync(join(tempDir, 'subdirectory/sample.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample.html'))).toBe(false)
		})

		it('renders file from deeply nested child directory', async () => {
			// Create deeply nested directory
			const deepDir = join(tempDir, 'level1/level2/level3')
			mkdirSync(deepDir, { recursive: true })
			copyFileSync(FIXTURE_PATH, join(deepDir, 'deep.md'))

			// Run from tempDir
			await runCLI(['level1/level2/level3/deep.md', '--pdf'], {
				cwd: tempDir,
			})

			// Output should be in the current directory, not nested directory
			expect(existsSync(join(tempDir, 'deep.pdf'))).toBe(true)
		})

		it('renders file from parent with custom output in current directory', async () => {
			const subDir = join(tempDir, 'subdirectory')
			mkdirSync(subDir, { recursive: true })

			// Run from subDir, input from parent, output to current directory
			await execa(
				'node',
				[CLI_PATH, '../sample.md', '--html', '-o', 'output-in-subdir'],
				{
					cwd: subDir,
				},
			)

			// Output should be in the current directory, not subdirectory
			expect(existsSync(join(subDir, 'output-in-subdir.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'output-in-subdir.html'))).toBe(false)
		})

		it('renders file from child with custom output directory', async () => {
			const subDir = join(tempDir, 'input-dir')
			mkdirSync(subDir, { recursive: true })
			copyFileSync(FIXTURE_PATH, join(subDir, 'source.md'))

			// Run from tempDir, input from child, output to different directory
			await execa(
				'node',
				[CLI_PATH, 'input-dir/source.md', '--pdf', '-o', 'output-dir/result'],
				{
					cwd: tempDir,
				},
			)

			// Output should be in the specified output directory relative to cwd
			expect(existsSync(join(tempDir, 'output-dir/result.pdf'))).toBe(true)
		})

		it('renders file using absolute path outputs to cwd', async () => {
			const absolutePath = join(tempDir, 'sample.md')
			const workDir = join(tempDir, 'work')
			mkdirSync(workDir, { recursive: true })

			// Run from workDir but use absolute path to file in tempDir
			await runCLI([absolutePath, '--html'], {
				cwd: workDir,
			})

			// Output should be in cwd (workDir), not with the input file
			expect(existsSync(join(workDir, 'sample.html'))).toBe(true)
		})

		it('renders sibling file from nested directory', async () => {
			// Create two sibling directories
			const dir1 = join(tempDir, 'dir1')
			const dir2 = join(tempDir, 'dir2')
			mkdirSync(dir1, { recursive: true })
			mkdirSync(dir2, { recursive: true })
			copyFileSync(FIXTURE_PATH, join(dir1, 'sibling.md'))

			// Run from dir2, reference file in dir1
			await runCLI(['../dir1/sibling.md', '--docx'], {
				cwd: dir2,
			})

			// Output should be in ../dir1/ relative to cwd (dir2)
			expect(existsSync(join(dir2, 'sibling.docx'))).toBe(true)
		})

		it('outputs to cwd when no -o flag, regardless of input location', async () => {
			// Create a nested input directory
			const inputDir = join(tempDir, 'source/nested')
			mkdirSync(inputDir, { recursive: true })
			copyFileSync(FIXTURE_PATH, join(inputDir, 'resume.md'))

			// Run from tempDir
			await runCLI(['source/nested/resume.md', '--pdf'], {
				cwd: tempDir,
			})

			// Output should be in cwd (tempDir), not in source/nested/
			expect(existsSync(join(tempDir, 'resume.pdf'))).toBe(true)
		})
	})

	describe('argument validation', () => {
		it('errors on extra positional argument', async () => {
			const result = await runCLI(['sample.md', 'extra.pdf'], {
				cwd: tempDir,
				reject: false,
			})

			expect(result.exitCode).not.toBe(0)
			expect(result.stderr).toContain('error')
		})

		it('errors on extra positional argument with options', async () => {
			const result = await execa(
				'node',
				[CLI_PATH, 'sample.md', '-s', 'minimal', 'extra.pdf'],
				{
					cwd: tempDir,
					reject: false,
				},
			)

			expect(result.exitCode).not.toBe(0)
			expect(result.stderr).toContain('error')
		})

		it('errors on multiple extra positional arguments', async () => {
			const result = await execa(
				'node',
				[CLI_PATH, 'sample.md', 'extra1.pdf', 'extra2.pdf'],
				{
					cwd: tempDir,
					reject: false,
				},
			)

			expect(result.exitCode).not.toBe(0)
			expect(result.stderr).toContain('error')
		})

		it('errors on unknown options', async () => {
			const result = await execa(
				'node',
				[CLI_PATH, 'sample.md', '--unknown-option'],
				{
					cwd: tempDir,
					reject: false,
				},
			)

			expect(result.exitCode).not.toBe(0)
			expect(result.stderr).toContain('error')
		})
	})

	describe('global style variable overrides', () => {
		let globalConfigDir: string

		beforeEach(() => {
			globalConfigDir = join(tempDir, '.config', 'resum8')
			mkdirSync(globalConfigDir, { recursive: true })
		})

		it('applies global style variables to HTML output', async () => {
			// Set up global style variables for classic style
			const store = createConfigStore(globalConfigDir)
			store.setStyleVariables('classic', {
				'font-family': 'TestFont, sans-serif',
			})

			// Render using classic style with the test config directory
			const { renderCommand } = await import('./render.js')

			const originalCwd = process.cwd
			const originalExit = process.exit
			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			await renderCommand(
				'sample.md',
				{
					html: true,
					style: 'classic', // Explicitly use classic to match the styleVariables
				},
				store,
			)

			process.cwd = originalCwd
			process.exit = originalExit

			// Read the HTML output and verify it contains the override
			const htmlPath = join(tempDir, 'sample.html')
			expect(existsSync(htmlPath)).toBe(true)

			const htmlContent = readFileSync(htmlPath, 'utf-8')
			expect(htmlContent).toContain('--font-family: TestFont, sans-serif')
		})

		it('CLI --var overrides global style variables', async () => {
			// Set up global style variables for classic style
			const store = createConfigStore(globalConfigDir)
			store.setStyleVariables('classic', { 'font-family': 'GlobalFont, serif' })

			const { renderCommand } = await import('./render.js')

			const originalCwd = process.cwd
			const originalExit = process.exit
			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			// CLI --var should override global style variables
			await renderCommand(
				'sample.md',
				{
					html: true,
					style: 'classic', // Explicitly use classic to match the styleVariables
					var: ['font-family=CLIFont, monospace'],
				},
				store,
			)

			process.cwd = originalCwd
			process.exit = originalExit

			const htmlPath = join(tempDir, 'sample.html')
			const htmlContent = readFileSync(htmlPath, 'utf-8')

			// Should contain CLI override, not global
			expect(htmlContent).toContain('--font-family: CLIFont, monospace')
			expect(htmlContent).not.toContain('GlobalFont')
		})
	})

	describe('frontmatter configuration', () => {
		it('uses style from YAML frontmatter', async () => {
			const mdContent = `---
style: formal
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'with-style.md'), mdContent)

			await runCLI(['with-style.md', '--html'], {
				cwd: tempDir,
			})

			// Should render successfully with formal style
			const htmlContent = readFileSync(
				join(tempDir, 'with-style.html'),
				'utf-8',
			)
			// Verify formal style font is applied (Palatino Linotype is distinctive to formal)
			expect(htmlContent).toContain('Palatino Linotype')
		})

		it('uses outputName from frontmatter', async () => {
			const mdContent = `---
outputName: custom-output-name
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--html'], {
				cwd: tempDir,
			})

			// Should create file with custom output name
			expect(existsSync(join(tempDir, 'custom-output-name.html'))).toBe(true)
			// Original filename should NOT be used
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(false)
		})

		it('uses outputDir from frontmatter', async () => {
			const mdContent = `---
outputDir: ./dist
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--html'], {
				cwd: tempDir,
			})

			// Should create file in specified directory
			expect(existsSync(join(tempDir, 'dist/resume.html'))).toBe(true)
		})

		it('uses formats from frontmatter', async () => {
			const mdContent = `---
formats:
  - html
  - pdf
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			// No explicit format flags - should use frontmatter formats
			await runCLI(['resume.md'], {
				cwd: tempDir,
			})

			// Should create both formats specified in frontmatter
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume.pdf'))).toBe(true)
			// docx should NOT be created (not in frontmatter)
			expect(existsSync(join(tempDir, 'resume.docx'))).toBe(false)
		})

		it('applies variables from frontmatter to CSS', async () => {
			const mdContent = `---
variables:
  font-family: "FrontmatterFont, serif"
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--html'], {
				cwd: tempDir,
			})

			const htmlContent = readFileSync(join(tempDir, 'resume.html'), 'utf-8')
			expect(htmlContent).toContain('--font-family: FrontmatterFont, serif')
		})

		it('CLI flags override frontmatter values', async () => {
			const mdContent = `---
outputName: frontmatter-name
style: minimal
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			// CLI -o should override frontmatter outputName
			await execa(
				'node',
				[CLI_PATH, 'resume.md', '--html', '-o', 'cli-name', '-s', 'formal'],
				{
					cwd: tempDir,
				},
			)

			// CLI output name should be used
			expect(existsSync(join(tempDir, 'cli-name.html'))).toBe(true)
			// Frontmatter name should NOT be used
			expect(existsSync(join(tempDir, 'frontmatter-name.html'))).toBe(false)
		})

		it('frontmatter is stripped from HTML output', async () => {
			const mdContent = `---
style: formal
outputName: test
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--html'], {
				cwd: tempDir,
			})

			const htmlContent = readFileSync(join(tempDir, 'test.html'), 'utf-8')

			// Frontmatter should not appear in output
			expect(htmlContent).not.toContain('style: formal')
			expect(htmlContent).not.toContain('outputName: test')
			// But content should be present
			expect(htmlContent).toContain('Test Person')
		})

		it('parses TOML frontmatter', async () => {
			const mdContent = `+++
style = "formal"
outputName = "toml-output"
+++
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--html'], {
				cwd: tempDir,
			})

			expect(existsSync(join(tempDir, 'toml-output.html'))).toBe(true)
		})

		it('combines outputName and outputDir from frontmatter', async () => {
			const mdContent = `---
outputName: combined
outputDir: ./build/output
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--html'], {
				cwd: tempDir,
			})

			expect(existsSync(join(tempDir, 'build/output/combined.html'))).toBe(true)
		})

		it('CLI --var overrides frontmatter variables', async () => {
			const mdContent = `---
variables:
  font-family: "FrontmatterFont, serif"
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await execa(
				'node',
				[CLI_PATH, 'resume.md', '--html', '--var', 'font-family=CLIFont, sans'],
				{
					cwd: tempDir,
				},
			)

			const htmlContent = readFileSync(join(tempDir, 'resume.html'), 'utf-8')
			expect(htmlContent).toContain('--font-family: CLIFont, sans')
			expect(htmlContent).not.toContain('FrontmatterFont')
		})
	})

	describe('role filtering', () => {
		it('filters content with --role flag', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}
- Common skill`
			writeFileSync(join(tempDir, 'resume-frontend.md'), mdContent)

			await runCLI(['resume.md', '--html', '--role', 'frontend'], {
				cwd: tempDir,
			})

			const htmlContent = readFileSync(
				join(tempDir, 'resume-frontend.html'),
				'utf-8',
			)
			expect(htmlContent).toContain('React')
			expect(htmlContent).not.toContain('Node.js')
			expect(htmlContent).toContain('Common skill')
		})

		it('auto-generates all role variants when roles exist', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--html'], {
				cwd: tempDir,
			})

			// Should generate separate files for each role
			expect(existsSync(join(tempDir, 'resume-frontend.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-backend.html'))).toBe(true)

			// Check content filtering
			const frontendHtml = readFileSync(
				join(tempDir, 'resume-frontend.html'),
				'utf-8',
			)
			expect(frontendHtml).toContain('React')
			expect(frontendHtml).not.toContain('Node.js')

			const backendHtml = readFileSync(
				join(tempDir, 'resume-backend.html'),
				'utf-8',
			)
			expect(backendHtml).toContain('Node.js')
			expect(backendHtml).not.toContain('React')
		})

		it('generates single file with explicit role flag', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--html', '--role', 'frontend'], {
				cwd: tempDir,
			})

			// Should generate single file (no role suffix when only one)
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(false)
			expect(existsSync(join(tempDir, 'resume-frontend.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-backend.html'))).toBe(false)
		})

		it('uses frontmatter roles to limit generation', async () => {
			const mdContent = `---
roles:
  - frontend
---
# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}
- Go {.role:devops}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--html'], {
				cwd: tempDir,
			})

			// Should only generate frontend (configured in frontmatter)
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(false)
			expect(existsSync(join(tempDir, 'resume-frontend.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-backend.html'))).toBe(false)
			expect(existsSync(join(tempDir, 'resume-devops.html'))).toBe(false)
		})

		it('renders normally when no roles in content', async () => {
			const mdContent = `# Test Person

## Skills

- React
- Node.js
- Go`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--html'], {
				cwd: tempDir,
			})

			// Should generate single file (no role suffix)
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)

			const htmlContent = readFileSync(join(tempDir, 'resume.html'), 'utf-8')
			expect(htmlContent).toContain('React')
			expect(htmlContent).toContain('Node.js')
			expect(htmlContent).toContain('Go')
		})

		it('filters fenced div blocks with role class', async () => {
			const mdContent = `# Test Person

::: {.role:frontend}
## Frontend Skills

- React
- TypeScript
:::

::: {.role:backend}
## Backend Skills

- Node.js
- PostgreSQL
:::`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--html', '--role', 'backend'], {
				cwd: tempDir,
			})

			const htmlContent = readFileSync(
				join(tempDir, 'resume-backend.html'),
				'utf-8',
			)
			expect(htmlContent).not.toContain('Frontend Skills')
			expect(htmlContent).not.toContain('React')
			expect(htmlContent).toContain('Backend Skills')
			expect(htmlContent).toContain('Node.js')
		})
	})
})
