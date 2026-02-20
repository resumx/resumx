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
import { renderCommand } from './render.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI_PATH = join(__dirname, '../../dist/index.js')
const FIXTURE_PATH = join(__dirname, '../../tests/fixtures/sample.md')

describe('render command', () => {
	let tempDir: string

	/**
	 * Helper to run CLI as a subprocess — only used for tests that require
	 * process-level behavior (stdin piping, Commander arg parsing).
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
	 * - `-o resume.pdf --format html` → resume.html (not resume.pdf.html)
	 * - Preserves non-document extensions: `-o file.backup --format html` → file.backup.html
	 * - Works with directory paths: `-o dist/resume.html --format pdf` → dist/resume.pdf
	 * - Works with multiple formats: all formats get correct extensions
	 *
	 * Other:
	 * - Theme selection
	 * - Error handling
	 * - Input filename priority over H1 heading
	 * - Argument validation
	 */

	beforeEach(() => {
		tempDir = join(tmpdir(), `resumx-render-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
		// Copy fixture to temp dir
		copyFileSync(FIXTURE_PATH, join(tempDir, 'sample.md'))
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	it('renders HTML output', async () => {
		await renderCommand('sample.md', { format: ['html'] }, tempDir)

		expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
	})

	it('renders PDF output', async () => {
		await renderCommand('sample.md', { format: ['pdf'] }, tempDir)

		expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
	})

	it('renders PNG output', async () => {
		await renderCommand('sample.md', { format: ['png'] }, tempDir)

		expect(existsSync(join(tempDir, 'sample.png'))).toBe(true)
	})

	it('renders all formats with --format pdf,html,docx', async () => {
		await renderCommand(
			'sample.md',
			{ format: ['pdf', 'html', 'docx'] },
			tempDir,
		)

		expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
		expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
		expect(existsSync(join(tempDir, 'sample.docx'))).toBe(true)
	})

	it('uses custom filename with -o', async () => {
		await renderCommand(
			'sample.md',
			{ format: ['html'], output: 'custom' },
			tempDir,
		)

		// Should output in same directory with custom name
		expect(existsSync(join(tempDir, 'custom.html'))).toBe(true)
	})

	it('uses custom output directory with -o', async () => {
		await renderCommand(
			'sample.md',
			{ format: ['html'], output: 'output/custom' },
			tempDir,
		)

		expect(existsSync(join(tempDir, 'output/custom.html'))).toBe(true)
	})

	it('uses directory path ending with slash to preserve input filename', async () => {
		await renderCommand(
			'sample.md',
			{ format: ['html'], output: 'output/' },
			tempDir,
		)

		// Should use input filename (sample) in the specified directory
		expect(existsSync(join(tempDir, 'output/sample.html'))).toBe(true)
	})

	it('strips extension from output name to avoid double extensions', async () => {
		await renderCommand(
			'sample.md',
			{ format: ['html'], output: 'resume.pdf' },
			tempDir,
		)

		// Should create resume.html, not resume.pdf.html
		expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)
		expect(existsSync(join(tempDir, 'resume.pdf.html'))).toBe(false)
	})

	it('strips extension from output path with directory', async () => {
		await renderCommand(
			'sample.md',
			{ format: ['pdf'], output: 'dist/resume.html' },
			tempDir,
		)

		// Should create dist/resume.pdf, not dist/resume.html.pdf
		expect(existsSync(join(tempDir, 'dist/resume.pdf'))).toBe(true)
		expect(existsSync(join(tempDir, 'dist/resume.html.pdf'))).toBe(false)
	})

	it('handles multiple format extensions correctly', async () => {
		await renderCommand(
			'sample.md',
			{ format: ['pdf', 'html', 'docx'], output: 'myresume.pdf' },
			tempDir,
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
		await renderCommand(
			'sample.md',
			{ format: ['html'], output: 'file.backup' },
			tempDir,
		)

		// Non-document extensions should be preserved
		expect(existsSync(join(tempDir, 'file.backup.html'))).toBe(true)
	})

	it('handles nested directory paths', async () => {
		await renderCommand(
			'sample.md',
			{ format: ['html'], output: 'build/output/dist/final' },
			tempDir,
		)

		// Should create nested directories and output file
		expect(existsSync(join(tempDir, 'build/output/dist/final.html'))).toBe(true)
	})

	it('handles deeply nested directory with trailing slash', async () => {
		await renderCommand(
			'sample.md',
			{ format: ['pdf'], output: 'dist/build/' },
			tempDir,
		)

		// Should preserve input filename in nested directory
		expect(existsSync(join(tempDir, 'dist/build/sample.pdf'))).toBe(true)
	})

	it('creates directory if output path includes directory', async () => {
		// Directory doesn't exist yet
		expect(existsSync(join(tempDir, 'build'))).toBe(false)

		await renderCommand(
			'sample.md',
			{ format: ['html'], output: 'build/result' },
			tempDir,
		)

		// Directory should be created and file placed inside
		expect(existsSync(join(tempDir, 'build'))).toBe(true)
		expect(existsSync(join(tempDir, 'build/result.html'))).toBe(true)
	})

	it('uses specified theme', async () => {
		await renderCommand(
			'sample.md',
			{ format: ['html'], theme: ['zurich'] },
			tempDir,
		)

		expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
	})

	it('fails gracefully with non-existent file', async () => {
		await expect(
			renderCommand('nonexistent.md', { format: ['html'] }, tempDir),
		).rejects.toThrow('not found')
	})

	it('output filename follows input filename, not H1 heading', async () => {
		// Copy fixture as "my-resume.md"
		copyFileSync(FIXTURE_PATH, join(tempDir, 'my-resume.md'))

		await renderCommand('my-resume.md', { format: ['html'] }, tempDir)

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
			await renderCommand(
				'subdirectory/nested.md',
				{ format: ['html'] },
				tempDir,
			)

			// Output should be in the parent directory, not subdirectory
			expect(existsSync(join(tempDir, 'nested.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'subdirectory/nested.html'))).toBe(false)
		})

		it('renders file from parent directory when running from child', async () => {
			// Create subdirectory
			const subDir = join(tempDir, 'subdirectory')
			mkdirSync(subDir, { recursive: true })

			// sample.md is in tempDir (parent), run from subDir (child)
			await renderCommand('../sample.md', { format: ['html'] }, subDir)

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
			await renderCommand(
				'level1/level2/level3/deep.md',
				{ format: ['pdf'] },
				tempDir,
			)

			// Output should be in the current directory, not nested directory
			expect(existsSync(join(tempDir, 'deep.pdf'))).toBe(true)
		})

		it('renders file from parent with custom output in current directory', async () => {
			const subDir = join(tempDir, 'subdirectory')
			mkdirSync(subDir, { recursive: true })

			// Run from subDir, input from parent, output to current directory
			await renderCommand(
				'../sample.md',
				{ format: ['html'], output: 'output-in-subdir' },
				subDir,
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
			await renderCommand(
				'input-dir/source.md',
				{ format: ['pdf'], output: 'output-dir/result' },
				tempDir,
			)

			// Output should be in the specified output directory relative to cwd
			expect(existsSync(join(tempDir, 'output-dir/result.pdf'))).toBe(true)
		})

		it('renders file using absolute path outputs to cwd', async () => {
			const absolutePath = join(tempDir, 'sample.md')
			const workDir = join(tempDir, 'work')
			mkdirSync(workDir, { recursive: true })

			// Run from workDir but use absolute path to file in tempDir
			await renderCommand(absolutePath, { format: ['html'] }, workDir)

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
			await renderCommand('../dir1/sibling.md', { format: ['docx'] }, dir2)

			// Output should be in ../dir1/ relative to cwd (dir2)
			expect(existsSync(join(dir2, 'sibling.docx'))).toBe(true)
		})

		it('outputs to cwd when no -o flag, regardless of input location', async () => {
			// Create a nested input directory
			const inputDir = join(tempDir, 'source/nested')
			mkdirSync(inputDir, { recursive: true })
			copyFileSync(FIXTURE_PATH, join(inputDir, 'resume.md'))

			// Run from tempDir
			await renderCommand(
				'source/nested/resume.md',
				{ format: ['pdf'] },
				tempDir,
			)

			// Output should be in cwd (tempDir), not in source/nested/
			expect(existsSync(join(tempDir, 'resume.pdf'))).toBe(true)
		})
	})

	// =========================================================================
	// Argument validation — tests Commander parsing, must use subprocess
	// =========================================================================
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
				[CLI_PATH, 'sample.md', '-t', 'seattle', 'extra.pdf'],
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

	describe('frontmatter configuration', () => {
		it('uses theme from YAML frontmatter', async () => {
			const mdContent = `---
themes: zurich
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'with-theme.md'), mdContent)

			await renderCommand('with-theme.md', { format: ['html'] }, tempDir)

			// Should render successfully with zurich theme
			const htmlContent = readFileSync(
				join(tempDir, 'with-theme.html'),
				'utf-8',
			)
			// Verify zurich theme font is applied (Palatino Linotype is distinctive to zurich)
			expect(htmlContent).toContain('Palatino Linotype')
		})

		it('uses output name from frontmatter', async () => {
			const mdContent = `---
output: custom-output-name
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

			// Should create file with custom output name
			expect(existsSync(join(tempDir, 'custom-output-name.html'))).toBe(true)
			// Original filename should NOT be used
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(false)
		})

		it('uses output directory from frontmatter', async () => {
			const mdContent = `---
output: ./dist/
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

			// Should create file in specified directory with default name
			expect(existsSync(join(tempDir, 'dist/resume.html'))).toBe(true)
		})

		it('applies style from frontmatter to CSS', async () => {
			const mdContent = `---
style:
  font-family: "FrontmatterFont, serif"
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

			const htmlContent = readFileSync(join(tempDir, 'resume.html'), 'utf-8')
			expect(htmlContent).toContain('--font-family: FrontmatterFont, serif')
		})

		it('CLI flags override frontmatter values', async () => {
			const mdContent = `---
output: frontmatter-name
themes: seattle
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			// CLI options override frontmatter
			await renderCommand(
				'resume.md',
				{ format: ['html'], output: 'cli-name', theme: ['zurich'] },
				tempDir,
			)

			// CLI output name should be used
			expect(existsSync(join(tempDir, 'cli-name.html'))).toBe(true)
			// Frontmatter name should NOT be used
			expect(existsSync(join(tempDir, 'frontmatter-name.html'))).toBe(false)
		})

		it('frontmatter is stripped from HTML output', async () => {
			const mdContent = `---
themes: zurich
output: test
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

			const htmlContent = readFileSync(join(tempDir, 'test.html'), 'utf-8')

			// Frontmatter should not appear in output
			expect(htmlContent).not.toContain('themes: zurich')
			expect(htmlContent).not.toContain('output: test')
			// But content should be present
			expect(htmlContent).toContain('Test Person')
		})

		it('parses TOML frontmatter', async () => {
			const mdContent = `+++
themes = "zurich"
output = "toml-output"
+++
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

			expect(existsSync(join(tempDir, 'toml-output.html'))).toBe(true)
		})

		it('uses output with directory and name from frontmatter', async () => {
			const mdContent = `---
output: ./build/output/combined
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

			expect(existsSync(join(tempDir, 'build/output/combined.html'))).toBe(true)
		})

		it('CLI --style overrides frontmatter style', async () => {
			const mdContent = `---
style:
  font-family: "FrontmatterFont, serif"
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], style: ['font-family=CLIFont, sans'] },
				tempDir,
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
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], role: ['frontend'] },
				tempDir,
			)

			// Single role → no suffix
			const htmlContent = readFileSync(join(tempDir, 'resume.html'), 'utf-8')
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

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

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

			await renderCommand(
				'resume.md',
				{ format: ['html'], role: ['frontend'] },
				tempDir,
			)

			// Single role selected → no suffix needed
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-frontend.html'))).toBe(false)
			expect(existsSync(join(tempDir, 'resume-backend.html'))).toBe(false)
		})

		it('renders normally when no roles in content', async () => {
			const mdContent = `# Test Person

## Skills

- React
- Node.js
- Go`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

			// Should generate single file (no role suffix)
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)

			const htmlContent = readFileSync(join(tempDir, 'resume.html'), 'utf-8')
			expect(htmlContent).toContain('React')
			expect(htmlContent).toContain('Node.js')
			expect(htmlContent).toContain('Go')
		})

		it('filters fenced div blocks with role class', async () => {
			const mdContent = `# Test Person

::: div {.role:frontend}
## Frontend Skills

- React
- TypeScript
:::

::: div {.role:backend}
## Backend Skills

- Node.js
- PostgreSQL
:::`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], role: ['backend'] },
				tempDir,
			)

			// Single role → no suffix
			const htmlContent = readFileSync(join(tempDir, 'resume.html'), 'utf-8')
			expect(htmlContent).not.toContain('Frontend Skills')
			expect(htmlContent).not.toContain('React')
			expect(htmlContent).toContain('Backend Skills')
			expect(htmlContent).toContain('Node.js')
		})
	})

	describe('language filtering', () => {
		it('auto-generates all language variants when langs exist', async () => {
			const mdContent = `# Test Person

## [Experience]{lang=en} [Expérience]{lang=fr}

- [Reduced API latency by 60%]{lang=en}
  [Réduction de la latence API de 60%]{lang=fr}
- React, Node.js, PostgreSQL`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

			// Should generate separate files for each language
			expect(existsSync(join(tempDir, 'resume-en.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-fr.html'))).toBe(true)

			// Check content filtering
			const enHtml = readFileSync(join(tempDir, 'resume-en.html'), 'utf-8')
			expect(enHtml).toContain('Experience')
			expect(enHtml).toContain('Reduced API latency by 60%')
			expect(enHtml).not.toContain('Expérience')
			expect(enHtml).not.toContain('Réduction de la latence')
			expect(enHtml).toContain('React, Node.js, PostgreSQL') // Common content

			const frHtml = readFileSync(join(tempDir, 'resume-fr.html'), 'utf-8')
			expect(frHtml).toContain('Expérience')
			expect(frHtml).toContain('Réduction de la latence API de 60%')
			expect(frHtml).not.toContain('Experience')
			expect(frHtml).not.toContain('Reduced API latency')
			expect(frHtml).toContain('React, Node.js, PostgreSQL') // Common content
		})

		it('filters content with --lang flag', async () => {
			const mdContent = `# Test Person

## [Experience]{lang=en} [Expérience]{lang=fr}

- [Built REST APIs]{lang=en}
  [Développé des APIs REST]{lang=fr}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], lang: ['en'] },
				tempDir,
			)

			// --lang en should generate only English
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-fr.html'))).toBe(false)

			const htmlContent = readFileSync(join(tempDir, 'resume.html'), 'utf-8')
			expect(htmlContent).toContain('Experience')
			expect(htmlContent).toContain('Built REST APIs')
			expect(htmlContent).not.toContain('Expérience')
			expect(htmlContent).not.toContain('Développé des APIs REST')
		})

		it('renders normally when no lang attributes in content', async () => {
			const mdContent = `# Test Person

## Experience

- Built REST APIs
- React, Node.js`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

			// Should generate single file (no lang suffix)
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)

			const htmlContent = readFileSync(join(tempDir, 'resume.html'), 'utf-8')
			expect(htmlContent).toContain('Built REST APIs')
		})

		it('single lang discovered produces no suffix', async () => {
			const mdContent = `# Test Person

## Experience

- [Built REST APIs]{lang=en}
- React, Node.js`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

			// Only one language discovered → no suffix
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-en.html'))).toBe(false)
		})

		it('combines lang with roles', async () => {
			const mdContent = `# Test Person

## [Skills]{lang=en} [Compétences]{lang=fr}

- [React]{lang=en} {.role:frontend}
- [Node.js]{lang=en} {.role:backend}
- [React]{lang=fr} {.role:frontend}
- [Node.js]{lang=fr} {.role:backend}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand('resume.md', { format: ['html'] }, tempDir)

			// 2 langs x 2 roles = 4 files, flat: {name}-{role}-{lang}.{format}
			expect(existsSync(join(tempDir, 'resume-frontend-en.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-frontend-fr.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-backend-en.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-backend-fr.html'))).toBe(true)
		})

		it('combines lang with themes', async () => {
			const mdContent = `# Test Person

## [Experience]{lang=en} [Expérience]{lang=fr}

- [Built APIs]{lang=en}
  [Développé des APIs]{lang=fr}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], theme: ['zurich', 'seattle'] },
				tempDir,
			)

			// 2 langs x 2 themes = 4 files
			expect(existsSync(join(tempDir, 'resume-en-zurich.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-en-seattle.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-fr-zurich.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-fr-seattle.html'))).toBe(true)
		})

		it('accepts comma-separated langs', async () => {
			const mdContent = `# Test Person

## [Experience]{lang=en} [Expérience]{lang=fr} [Erfahrung]{lang=de}

- [Built APIs]{lang=en}
  [Développé des APIs]{lang=fr}
  [APIs entwickelt]{lang=de}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], lang: ['en', 'fr'] },
				tempDir,
			)

			// Should generate only en and fr, not de
			expect(existsSync(join(tempDir, 'resume-en.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-fr.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-de.html'))).toBe(false)
		})

		it('errors when --lang specifies non-existent language', async () => {
			const mdContent = `# Test Person

## [Experience]{lang=en} [Expérience]{lang=fr}

- [Built APIs]{lang=en}
  [Développé des APIs]{lang=fr}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await expect(
				renderCommand('resume.md', { format: ['html'], lang: ['de'] }, tempDir),
			).rejects.toThrow("language 'de' does not exist")
		})

		it('handles fenced div blocks with lang attribute', async () => {
			const mdContent = `# Test Person

## Education

::: div {lang=fr}
- Moyenne cumulative : 3.82
- Cours avancés : Systèmes distribués
:::

::: div {lang=en}
- GPA: 3.82
- Advanced courses: Distributed Systems
:::`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], lang: ['en'] },
				tempDir,
			)

			const htmlContent = readFileSync(join(tempDir, 'resume.html'), 'utf-8')
			expect(htmlContent).toContain('GPA: 3.82')
			expect(htmlContent).toContain('Distributed Systems')
			expect(htmlContent).not.toContain('Moyenne cumulative')
			expect(htmlContent).not.toContain('Systèmes distribués')
		})
	})

	describe('comma-separated CLI options', () => {
		it('accepts comma-separated roles', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}
- Go {.role:devops}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], role: ['frontend', 'backend'] },
				tempDir,
			)

			// Should generate both specified roles
			expect(existsSync(join(tempDir, 'resume-frontend.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-backend.html'))).toBe(true)
			// But not devops
			expect(existsSync(join(tempDir, 'resume-devops.html'))).toBe(false)
		})

		it('accepts comma-separated roles with spaces', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], role: ['frontend', 'backend'] },
				tempDir,
			)

			expect(existsSync(join(tempDir, 'resume-frontend.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-backend.html'))).toBe(true)
		})

		it('combines repeated flags with comma-separated values', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}
- Go {.role:devops}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], role: ['frontend', 'backend', 'devops'] },
				tempDir,
			)

			// Should generate all three
			expect(existsSync(join(tempDir, 'resume-frontend.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-backend.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-devops.html'))).toBe(true)
		})

		it('ignores empty values from trailing commas', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], role: ['frontend'] },
				tempDir,
			)

			// Single role after trimming → no suffix
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)
			// Should not create an empty-named or suffixed file
			expect(existsSync(join(tempDir, 'resume-.html'))).toBe(false)
			expect(existsSync(join(tempDir, 'resume-frontend.html'))).toBe(false)
		})
	})

	describe('multi-theme rendering', () => {
		it('generates multiple theme variants with theme suffix', async () => {
			// multi-theme, no roles → resume-zurich.html, resume-seattle.html
			await renderCommand(
				'sample.md',
				{ format: ['html'], theme: ['zurich', 'seattle'] },
				tempDir,
			)

			// Should generate both theme variants
			expect(existsSync(join(tempDir, 'sample-zurich.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample-seattle.html'))).toBe(true)

			// Verify each uses the correct theme
			const zurichHtml = readFileSync(
				join(tempDir, 'sample-zurich.html'),
				'utf-8',
			)
			expect(zurichHtml).toContain('Palatino Linotype') // zurich theme font

			const seattleHtml = readFileSync(
				join(tempDir, 'sample-seattle.html'),
				'utf-8',
			)
			expect(seattleHtml).toContain('Helvetica Neue') // seattle theme font
		})

		it('generates flat filenames for multi-theme + roles', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			// multi-theme + roles → resume-frontend-zurich.html, etc.
			await renderCommand(
				'resume.md',
				{
					format: ['html'],
					theme: ['zurich', 'seattle'],
					role: ['frontend', 'backend'],
				},
				tempDir,
			)

			// Flat naming: {name}-{role}-{theme}.{format}
			expect(existsSync(join(tempDir, 'resume-frontend-zurich.html'))).toBe(
				true,
			)
			expect(existsSync(join(tempDir, 'resume-frontend-seattle.html'))).toBe(
				true,
			)
			expect(existsSync(join(tempDir, 'resume-backend-zurich.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-backend-seattle.html'))).toBe(
				true,
			)

			// Verify content filtering in frontend + zurich variant
			const frontendZurichHtml = readFileSync(
				join(tempDir, 'resume-frontend-zurich.html'),
				'utf-8',
			)
			expect(frontendZurichHtml).toContain('React')
			expect(frontendZurichHtml).not.toContain('Node.js')
			expect(frontendZurichHtml).toContain('Palatino Linotype') // zurich theme

			// Verify content filtering in backend + seattle variant
			const backendSeattleHtml = readFileSync(
				join(tempDir, 'resume-backend-seattle.html'),
				'utf-8',
			)
			expect(backendSeattleHtml).toContain('Node.js')
			expect(backendSeattleHtml).not.toContain('React')
			expect(backendSeattleHtml).toContain('Helvetica Neue') // seattle theme
		})

		it('single theme with no roles produces no suffix', async () => {
			await renderCommand(
				'sample.md',
				{ format: ['html'], theme: ['zurich'] },
				tempDir,
			)

			// Should generate single file with no suffix
			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample-zurich.html'))).toBe(false)
		})

		it('single theme with single role produces no suffix', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await renderCommand(
				'resume.md',
				{ format: ['html'], theme: ['zurich'], role: ['frontend'] },
				tempDir,
			)

			// Single role + single theme → no suffix for either
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-frontend.html'))).toBe(false)
			expect(existsSync(join(tempDir, 'resume-zurich.html'))).toBe(false)
		})

		it('supports repeated --theme flags', async () => {
			await renderCommand(
				'sample.md',
				{ format: ['html'], theme: ['zurich', 'seattle'] },
				tempDir,
			)

			// Should generate both theme variants
			expect(existsSync(join(tempDir, 'sample-zurich.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample-seattle.html'))).toBe(true)
		})
	})

	describe('--format / -f flag', () => {
		it('accepts -f shorthand', async () => {
			await renderCommand('sample.md', { format: ['html'] }, tempDir)

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
		})

		it('accepts comma-separated formats with -f', async () => {
			await renderCommand('sample.md', { format: ['html', 'pdf'] }, tempDir)

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
		})

		it('accepts repeated -f flags', async () => {
			await renderCommand('sample.md', { format: ['html', 'pdf'] }, tempDir)

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
		})

		it('combines repeated -f with comma-separated values', async () => {
			await renderCommand(
				'sample.md',
				{ format: ['html', 'pdf', 'png'] },
				tempDir,
			)

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample.png'))).toBe(true)
		})

		it('errors on unknown format value', async () => {
			await expect(
				renderCommand('sample.md', { format: ['xlsx'] }, tempDir),
			).rejects.toThrow("Unknown format: 'xlsx'")
		})

		it('errors on mixed valid and invalid format values', async () => {
			await expect(
				renderCommand('sample.md', { format: ['html', 'rtf'] }, tempDir),
			).rejects.toThrow("Unknown format: 'rtf'")
		})

		it('errors on empty format value', async () => {
			// Commander parsing edge case — keep as subprocess test
			const result = await execa('node', [CLI_PATH, 'sample.md', '--format'], {
				cwd: tempDir,
				reject: false,
			})

			expect(result.exitCode).not.toBe(0)
		})

		it('ignores empty values from trailing comma in format', async () => {
			// With direct import, empty strings are already filtered by Commander
			await renderCommand('sample.md', { format: ['html'] }, tempDir)

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
		})

		it('ignores empty values from leading comma in format', async () => {
			await renderCommand('sample.md', { format: ['html'] }, tempDir)

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
		})

		it('treats space-separated values as a single unknown format', async () => {
			await expect(
				renderCommand('sample.md', { format: ['html pdf'] }, tempDir),
			).rejects.toThrow("Unknown format: 'html pdf'")
		})

		it('treats semicolon-separated values as a single unknown format', async () => {
			await expect(
				renderCommand('sample.md', { format: ['html;pdf'] }, tempDir),
			).rejects.toThrow("Unknown format: 'html;pdf'")
		})

		it('is case-sensitive (rejects uppercase)', async () => {
			await expect(
				renderCommand('sample.md', { format: ['HTML'] }, tempDir),
			).rejects.toThrow("Unknown format: 'HTML'")
		})

		it('defaults to PDF when no --format flag', async () => {
			await renderCommand('sample.md', {}, tempDir)

			expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample.html'))).toBe(false)
		})
	})

	// =========================================================================
	// Stdin input — requires subprocess for pipe behavior
	// =========================================================================
	describe('stdin input', () => {
		const STDIN_CONTENT = `# Jane Smith

> jane@example.com | 555-1234

## Experience

- Built things at Company A
- Led team at Company B
`

		it('renders HTML from explicit - argument', async () => {
			await execa('node', [CLI_PATH, '-', '--format', 'html'], {
				cwd: tempDir,
				input: STDIN_CONTENT,
			})

			// Output name derived from h1: Jane_Smith.html
			expect(existsSync(join(tempDir, 'Jane_Smith.html'))).toBe(true)
		})

		it('renders HTML from piped stdin (no file argument)', async () => {
			await execa('node', [CLI_PATH, '--format', 'html'], {
				cwd: tempDir,
				input: STDIN_CONTENT,
			})

			// Output name derived from h1: Jane_Smith.html
			expect(existsSync(join(tempDir, 'Jane_Smith.html'))).toBe(true)
		})

		it('renders PDF from stdin', async () => {
			await execa('node', [CLI_PATH, '-', '--format', 'pdf'], {
				cwd: tempDir,
				input: STDIN_CONTENT,
			})

			expect(existsSync(join(tempDir, 'Jane_Smith.pdf'))).toBe(true)
		})

		it('uses -o to override output name from stdin', async () => {
			await execa('node', [CLI_PATH, '-', '--format', 'html', '-o', 'custom'], {
				cwd: tempDir,
				input: STDIN_CONTENT,
			})

			expect(existsSync(join(tempDir, 'custom.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'Jane_Smith.html'))).toBe(false)
		})

		it('uses frontmatter output from stdin content', async () => {
			const contentWithFrontmatter = `---
output: from-frontmatter
---
# Jane Smith

Some content
`
			await execa('node', [CLI_PATH, '-', '--format', 'html'], {
				cwd: tempDir,
				input: contentWithFrontmatter,
			})

			expect(existsSync(join(tempDir, 'from-frontmatter.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'Jane_Smith.html'))).toBe(false)
		})

		it('applies theme from stdin frontmatter', async () => {
			const contentWithTheme = `---
themes: zurich
---
# Jane Smith

Some content
`
			await execa('node', [CLI_PATH, '-', '--format', 'html'], {
				cwd: tempDir,
				input: contentWithTheme,
			})

			const htmlContent = readFileSync(
				join(tempDir, 'Jane_Smith.html'),
				'utf-8',
			)
			expect(htmlContent).toContain('Palatino Linotype')
		})

		it('errors when --watch is used with stdin', async () => {
			const result = await execa(
				'node',
				[CLI_PATH, '-', '--format', 'html', '--watch'],
				{
					cwd: tempDir,
					input: STDIN_CONTENT,
					reject: false,
				},
			)

			expect(result.exitCode).toBe(1)
			expect(result.stderr).toContain('--watch cannot be used with stdin')
		})

		it('errors when stdin has no h1 and no -o', async () => {
			const noH1Content = `Some content without a heading

- Item 1
- Item 2
`
			const result = await execa('node', [CLI_PATH, '-', '--format', 'html'], {
				cwd: tempDir,
				input: noH1Content,
				reject: false,
			})

			expect(result.exitCode).toBe(1)
			expect(result.stderr).toContain('Cannot determine output filename')
		})

		it('explicit file argument takes precedence over piped stdin', async () => {
			const result = await execa(
				'node',
				[CLI_PATH, 'sample.md', '--format', 'html'],
				{
					cwd: tempDir,
					input: STDIN_CONTENT,
				},
			)

			// Should use the file, not stdin — output named after the file
			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'Jane_Smith.html'))).toBe(false)
			expect(result.exitCode).toBe(0)
		})

		it('renders multiple formats from stdin', async () => {
			await execa('node', [CLI_PATH, '-', '--format', 'html,pdf'], {
				cwd: tempDir,
				input: STDIN_CONTENT,
			})

			expect(existsSync(join(tempDir, 'Jane_Smith.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'Jane_Smith.pdf'))).toBe(true)
		})

		it('uses -o with directory path for stdin output', async () => {
			await execa(
				'node',
				[CLI_PATH, '-', '--format', 'html', '-o', 'output/'],
				{
					cwd: tempDir,
					input: STDIN_CONTENT,
				},
			)

			expect(existsSync(join(tempDir, 'output/Jane_Smith.html'))).toBe(true)
		})
	})

	// =========================================================================
	// --check, --strict, --no-check
	// =========================================================================

	describe('--check flag', () => {
		it('exits 0 for valid resume with --check', async () => {
			await renderCommand('sample.md', { check: true }, tempDir)

			// Should NOT produce output files
			expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(false)
		})

		it('exits 1 for invalid resume with --check', async () => {
			const invalidResume = `## Education\n\n### University\n\n- Some content\n`
			writeFileSync(join(tempDir, 'invalid.md'), invalidResume)

			await expect(
				renderCommand('invalid.md', { check: true }, tempDir),
			).rejects.toThrow()
			expect(existsSync(join(tempDir, 'invalid.pdf'))).toBe(false)
		})

		it('errors when combined with --watch', async () => {
			await expect(
				renderCommand('sample.md', { check: true, watch: true }, tempDir),
			).rejects.toThrow('--check cannot be used with --watch')
		})
	})

	describe('--strict flag', () => {
		it('renders valid resume with --strict', async () => {
			// sample.md has bonus-level issues (single-bullet sections),
			// use --min-severity warning to exclude them
			await renderCommand(
				'sample.md',
				{ strict: true, minSeverity: 'warning', format: ['html'] },
				tempDir,
			)

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
		})

		it('blocks render for resume with warnings in --strict mode', async () => {
			// Resume with warnings (no-entries) but no critical issues
			const warningResume = `# John Doe\n\n> john@example.com\n\n## Skills\n\nLanguages\n: TypeScript\n`
			writeFileSync(join(tempDir, 'warning.md'), warningResume)

			await expect(
				renderCommand(
					'warning.md',
					{ strict: true, format: ['html'] },
					tempDir,
				),
			).rejects.toThrow()
			expect(existsSync(join(tempDir, 'warning.html'))).toBe(false)
		})
	})

	describe('--no-check flag', () => {
		it('renders without validation output', async () => {
			await renderCommand(
				'sample.md',
				{ check: false, format: ['html'] },
				tempDir,
			)

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
		})

		it('renders invalid resume without blocking', async () => {
			// Resume with critical validation issues
			const invalidResume = `## Education\n\n### University\n\n- Some content\n`
			writeFileSync(join(tempDir, 'invalid.md'), invalidResume)

			await renderCommand(
				'invalid.md',
				{ check: false, format: ['html'] },
				tempDir,
			)

			// Should still render despite validation issues
			expect(existsSync(join(tempDir, 'invalid.html'))).toBe(true)
		})
	})

	describe('--check with --strict', () => {
		it('exits 1 for resume with warnings', async () => {
			const warningResume = `# John Doe\n\n> john@example.com\n\n## Skills\n\nLanguages\n: TypeScript\n`
			writeFileSync(join(tempDir, 'warning.md'), warningResume)

			await expect(
				renderCommand('warning.md', { check: true, strict: true }, tempDir),
			).rejects.toThrow()
			expect(existsSync(join(tempDir, 'warning.pdf'))).toBe(false)
		})

		it('exits 0 for clean resume', async () => {
			// sample.md has bonus-level issues, use --min-severity warning to exclude them
			await renderCommand(
				'sample.md',
				{ check: true, strict: true, minSeverity: 'warning' },
				tempDir,
			)
		})
	})
})
