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

// =============================================================================
// Mock theme helpers — isolate tests from bundled theme names
// =============================================================================

const MOCK_FORMAL_CSS = `
:root {
	--font-family: 'Palatino Linotype', 'Palatino', 'Georgia', serif;
	--section-header-color: #c43218;
}
`

const MOCK_MODERN_CSS = `
:root {
	--font-family: 'Helvetica Neue', 'Arial', sans-serif;
	--accent-color: #2b6cb0;
}
`

const MOCK_CLASSIC_CSS = `
:root {
	--font-family: 'Times New Roman', serif;
	--font-size: 11pt;
}
`

/** Write a mock CSS file into tempDir/themes/ so the CLI resolves it as a local theme. */
function writeMockTheme(dir: string, name: string, css: string) {
	const themesDir = join(dir, 'themes')
	mkdirSync(themesDir, { recursive: true })
	writeFileSync(join(themesDir, `${name}.css`), css)
}

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

		// Write mock themes so tests don't depend on bundled theme names
		writeMockTheme(tempDir, 'formal', MOCK_FORMAL_CSS)
		writeMockTheme(tempDir, 'modern', MOCK_MODERN_CSS)
		writeMockTheme(tempDir, 'classic', MOCK_CLASSIC_CSS)

		// Set test config directory to avoid using global config
		process.env.RESUMX_CONFIG_DIR = join(tempDir, '.config', 'resumx')
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
		// Clean up test env var
		delete process.env.RESUMX_CONFIG_DIR
	})

	it('renders HTML output', async () => {
		await runCLI(['sample.md', '--format', 'html'], { cwd: tempDir })

		expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
	})

	it('renders PDF output', async () => {
		await runCLI(['sample.md', '--format', 'pdf'], {
			cwd: tempDir,
		})

		expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
	})

	it('renders PNG output', async () => {
		await runCLI(['sample.md', '--format', 'png'], {
			cwd: tempDir,
		})

		expect(existsSync(join(tempDir, 'sample.png'))).toBe(true)
	})

	it('renders all formats with --format pdf,html,docx', async () => {
		await runCLI(['sample.md', '--format', 'pdf,html,docx'], {
			cwd: tempDir,
		})

		expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
		expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
		expect(existsSync(join(tempDir, 'sample.docx'))).toBe(true)
	})

	it('uses custom filename with -o', async () => {
		await runCLI(['sample.md', '--format', 'html', '-o', 'custom'], {
			cwd: tempDir,
		})

		// Should output in same directory with custom name
		expect(existsSync(join(tempDir, 'custom.html'))).toBe(true)
	})

	it('uses custom output directory with -o', async () => {
		await execa(
			'node',
			[CLI_PATH, 'sample.md', '--format', 'html', '-o', 'output/custom'],
			{
				cwd: tempDir,
			},
		)

		expect(existsSync(join(tempDir, 'output/custom.html'))).toBe(true)
	})

	it('uses directory path ending with slash to preserve input filename', async () => {
		await runCLI(['sample.md', '--format', 'html', '-o', 'output/'], {
			cwd: tempDir,
		})

		// Should use input filename (sample) in the specified directory
		expect(existsSync(join(tempDir, 'output/sample.html'))).toBe(true)
	})

	it('strips extension from output name to avoid double extensions', async () => {
		await runCLI(['sample.md', '--format', 'html', '-o', 'resume.pdf'], {
			cwd: tempDir,
		})

		// Should create resume.html, not resume.pdf.html
		expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)
		expect(existsSync(join(tempDir, 'resume.pdf.html'))).toBe(false)
	})

	it('strips extension from output path with directory', async () => {
		await execa(
			'node',
			[CLI_PATH, 'sample.md', '--format', 'pdf', '-o', 'dist/resume.html'],
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
			[
				CLI_PATH,
				'sample.md',
				'--format',
				'pdf,html,docx',
				'-o',
				'myresume.pdf',
			],
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
			[CLI_PATH, 'sample.md', '--format', 'html', '-o', 'file.backup'],
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
			[
				CLI_PATH,
				'sample.md',
				'--format',
				'html',
				'-o',
				'build/output/dist/final',
			],
			{
				cwd: tempDir,
			},
		)

		// Should create nested directories and output file
		expect(existsSync(join(tempDir, 'build/output/dist/final.html'))).toBe(true)
	})

	it('handles deeply nested directory with trailing slash', async () => {
		await runCLI(['sample.md', '--format', 'pdf', '-o', 'dist/build/'], {
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
			[CLI_PATH, 'sample.md', '--format', 'html', '-o', 'build/result'],
			{
				cwd: tempDir,
			},
		)

		// Directory should be created and file placed inside
		expect(existsSync(join(tempDir, 'build'))).toBe(true)
		expect(existsSync(join(tempDir, 'build/result.html'))).toBe(true)
	})

	it('uses specified theme', async () => {
		await execa(
			'node',
			[CLI_PATH, 'sample.md', '--format', 'html', '--theme', 'formal'],
			{ cwd: tempDir },
		)

		expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
	})

	it('fails gracefully with non-existent file', async () => {
		const result = await runCLI(['nonexistent.md', '--format', 'html'], {
			cwd: tempDir,
			reject: false,
		})

		expect(result.exitCode).toBe(1)
		expect(result.stderr).toContain('not found')
	})

	it('output filename follows input filename, not H1 heading', async () => {
		// Copy fixture as "my-resume.md"
		copyFileSync(FIXTURE_PATH, join(tempDir, 'my-resume.md'))

		await runCLI(['my-resume.md', '--format', 'html'], {
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
			await runCLI(['subdirectory/nested.md', '--format', 'html'], {
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
			await runCLI(['../sample.md', '--format', 'html'], {
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
			await runCLI(['level1/level2/level3/deep.md', '--format', 'pdf'], {
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
				[
					CLI_PATH,
					'../sample.md',
					'--format',
					'html',
					'-o',
					'output-in-subdir',
				],
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
				[
					CLI_PATH,
					'input-dir/source.md',
					'--format',
					'pdf',
					'-o',
					'output-dir/result',
				],
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
			await runCLI([absolutePath, '--format', 'html'], {
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
			await runCLI(['../dir1/sibling.md', '--format', 'docx'], {
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
			await runCLI(['source/nested/resume.md', '--format', 'pdf'], {
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
				[CLI_PATH, 'sample.md', '-t', 'modern', 'extra.pdf'],
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

	describe('global theme variable overrides', () => {
		let globalConfigDir: string

		beforeEach(() => {
			globalConfigDir = join(tempDir, '.config', 'resumx')
			mkdirSync(globalConfigDir, { recursive: true })
		})

		it('applies global theme variables to HTML output', async () => {
			// Set up global theme variables for classic theme
			const store = createConfigStore(globalConfigDir)
			store.setThemeStyles('classic', {
				'font-family': 'TestFont, sans-serif',
			})

			// Render using classic theme with the test config directory
			const { renderCommand } = await import('./render.js')

			const originalCwd = process.cwd
			const originalExit = process.exit
			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			await renderCommand(
				'sample.md',
				{
					format: ['html'],
					theme: ['classic'], // Explicitly use classic to match the themeStyles
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

		it('CLI --style overrides global theme variables', async () => {
			// Set up global theme variables for classic theme
			const store = createConfigStore(globalConfigDir)
			store.setThemeStyles('classic', { 'font-family': 'GlobalFont, serif' })

			const { renderCommand } = await import('./render.js')

			const originalCwd = process.cwd
			const originalExit = process.exit
			process.cwd = () => tempDir
			process.exit = (() => {}) as typeof process.exit

			// CLI --style should override global theme variables
			await renderCommand(
				'sample.md',
				{
					format: ['html'],
					theme: ['classic'], // Explicitly use classic to match the themeStyles
					style: ['font-family=CLIFont, monospace'],
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
		it('uses theme from YAML frontmatter', async () => {
			const mdContent = `---
themes: formal
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'with-theme.md'), mdContent)

			await runCLI(['with-theme.md', '--format', 'html'], {
				cwd: tempDir,
			})

			// Should render successfully with formal theme
			const htmlContent = readFileSync(
				join(tempDir, 'with-theme.html'),
				'utf-8',
			)
			// Verify formal theme font is applied (Palatino Linotype is distinctive to formal)
			expect(htmlContent).toContain('Palatino Linotype')
		})

		it('uses output name from frontmatter', async () => {
			const mdContent = `---
output: custom-output-name
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--format', 'html'], {
				cwd: tempDir,
			})

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

			await runCLI(['resume.md', '--format', 'html'], {
				cwd: tempDir,
			})

			// Should create file in specified directory with default name
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

		it('applies style from frontmatter to CSS', async () => {
			const mdContent = `---
style:
  font-family: "FrontmatterFont, serif"
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--format', 'html'], {
				cwd: tempDir,
			})

			const htmlContent = readFileSync(join(tempDir, 'resume.html'), 'utf-8')
			expect(htmlContent).toContain('--font-family: FrontmatterFont, serif')
		})

		it('CLI flags override frontmatter values', async () => {
			const mdContent = `---
output: frontmatter-name
themes: modern
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			// CLI -o should override frontmatter output
			await execa(
				'node',
				[
					CLI_PATH,
					'resume.md',
					'--format',
					'html',
					'-o',
					'cli-name',
					'-t',
					'formal',
				],
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
themes: formal
output: test
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--format', 'html'], {
				cwd: tempDir,
			})

			const htmlContent = readFileSync(join(tempDir, 'test.html'), 'utf-8')

			// Frontmatter should not appear in output
			expect(htmlContent).not.toContain('themes: formal')
			expect(htmlContent).not.toContain('output: test')
			// But content should be present
			expect(htmlContent).toContain('Test Person')
		})

		it('parses TOML frontmatter', async () => {
			const mdContent = `+++
themes = "formal"
output = "toml-output"
+++
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--format', 'html'], {
				cwd: tempDir,
			})

			expect(existsSync(join(tempDir, 'toml-output.html'))).toBe(true)
		})

		it('uses output with directory and name from frontmatter', async () => {
			const mdContent = `---
output: ./build/output/combined
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--format', 'html'], {
				cwd: tempDir,
			})

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

			await execa(
				'node',
				[
					CLI_PATH,
					'resume.md',
					'--format',
					'html',
					'--style',
					'font-family=CLIFont, sans',
				],
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
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--format', 'html', '--role', 'frontend'], {
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

			await runCLI(['resume.md', '--format', 'html'], {
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

			await runCLI(['resume.md', '--format', 'html', '--role', 'frontend'], {
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

			await runCLI(['resume.md', '--format', 'html'], {
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

			await runCLI(['resume.md', '--format', 'html'], {
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

			await runCLI(['resume.md', '--format', 'html', '--role', 'backend'], {
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

	describe('comma-separated CLI options', () => {
		it('accepts comma-separated roles', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}
- Go {.role:devops}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			// Using comma-separated roles
			await runCLI(
				['resume.md', '--format', 'html', '--role', 'frontend,backend'],
				{
					cwd: tempDir,
				},
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

			// Using comma-separated with spaces
			await runCLI(
				['resume.md', '--format', 'html', '--role', 'frontend, backend'],
				{
					cwd: tempDir,
				},
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

			// Combine repeated flags and comma-separated
			await runCLI(
				[
					'resume.md',
					'--format',
					'html',
					'--role',
					'frontend',
					'--role',
					'backend,devops',
				],
				{
					cwd: tempDir,
				},
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

			// Trailing comma should not cause issues
			await runCLI(['resume.md', '--format', 'html', '--role', 'frontend,'], {
				cwd: tempDir,
			})

			expect(existsSync(join(tempDir, 'resume-frontend.html'))).toBe(true)
			// Should not create an empty-named file
			expect(existsSync(join(tempDir, 'resume-.html'))).toBe(false)
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(false)
		})
	})

	describe('multi-theme rendering', () => {
		it('generates multiple theme variants with theme suffix', async () => {
			// multi-theme, no roles → resume-formal.html, resume-modern.html
			await runCLI(
				['sample.md', '--format', 'html', '--theme', 'formal,modern'],
				{
					cwd: tempDir,
				},
			)

			// Should generate both theme variants
			expect(existsSync(join(tempDir, 'sample-formal.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample-modern.html'))).toBe(true)

			// Verify each uses the correct theme
			const formalHtml = readFileSync(
				join(tempDir, 'sample-formal.html'),
				'utf-8',
			)
			expect(formalHtml).toContain('Palatino Linotype') // formal theme font

			const modernHtml = readFileSync(
				join(tempDir, 'sample-modern.html'),
				'utf-8',
			)
			expect(modernHtml).toContain('Helvetica Neue') // modern theme font
		})

		it('generates role folders with theme suffix for multi-theme + roles', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			// multi-theme + roles → frontend/resume-formal.html, frontend/resume-modern.html, etc.
			await runCLI(
				[
					'resume.md',
					'--format',
					'html',
					'--theme',
					'formal,modern',
					'--role',
					'frontend,backend',
				],
				{
					cwd: tempDir,
				},
			)

			// Should generate role folders with theme-suffixed files
			expect(existsSync(join(tempDir, 'frontend/resume-formal.html'))).toBe(
				true,
			)
			expect(existsSync(join(tempDir, 'frontend/resume-modern.html'))).toBe(
				true,
			)
			expect(existsSync(join(tempDir, 'backend/resume-formal.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'backend/resume-modern.html'))).toBe(true)

			// Verify content filtering in frontend variant
			const frontendFormalHtml = readFileSync(
				join(tempDir, 'frontend/resume-formal.html'),
				'utf-8',
			)
			expect(frontendFormalHtml).toContain('React')
			expect(frontendFormalHtml).not.toContain('Node.js')
			expect(frontendFormalHtml).toContain('Palatino Linotype') // formal theme

			// Verify content filtering in backend variant
			const backendModernHtml = readFileSync(
				join(tempDir, 'backend/resume-modern.html'),
				'utf-8',
			)
			expect(backendModernHtml).toContain('Node.js')
			expect(backendModernHtml).not.toContain('React')
			expect(backendModernHtml).toContain('Helvetica Neue') // modern theme
		})

		it('single theme with no roles produces no suffix', async () => {
			await runCLI(['sample.md', '--format', 'html', '--theme', 'formal'], {
				cwd: tempDir,
			})

			// Should generate single file with no suffix
			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample-formal.html'))).toBe(false)
		})

		it('single theme with roles produces role suffix only', async () => {
			const mdContent = `# Test Person

## Skills

- React {.role:frontend}
- Node.js {.role:backend}`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(
				[
					'resume.md',
					'--format',
					'html',
					'--theme',
					'formal',
					'--role',
					'frontend',
				],
				{
					cwd: tempDir,
				},
			)

			// Should generate file with role suffix, no theme suffix
			expect(existsSync(join(tempDir, 'resume-frontend.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume-formal.html'))).toBe(false)
			expect(existsSync(join(tempDir, 'resume-frontend-formal.html'))).toBe(
				false,
			)
		})

		it('supports repeated --theme flags', async () => {
			await runCLI(
				[
					'sample.md',
					'--format',
					'html',
					'--theme',
					'formal',
					'--theme',
					'modern',
				],
				{
					cwd: tempDir,
				},
			)

			// Should generate both theme variants
			expect(existsSync(join(tempDir, 'sample-formal.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample-modern.html'))).toBe(true)
		})
	})

	describe('--format / -f flag', () => {
		it('accepts -f shorthand', async () => {
			await runCLI(['sample.md', '-f', 'html'], {
				cwd: tempDir,
			})

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
		})

		it('accepts comma-separated formats with -f', async () => {
			await runCLI(['sample.md', '-f', 'html,pdf'], {
				cwd: tempDir,
			})

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
		})

		it('accepts repeated -f flags', async () => {
			await runCLI(['sample.md', '-f', 'html', '-f', 'pdf'], {
				cwd: tempDir,
			})

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
		})

		it('combines repeated -f with comma-separated values', async () => {
			await runCLI(['sample.md', '-f', 'html', '-f', 'pdf,png'], {
				cwd: tempDir,
			})

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample.png'))).toBe(true)
		})

		it('errors on unknown format value', async () => {
			const result = await runCLI(['sample.md', '--format', 'xlsx'], {
				cwd: tempDir,
				reject: false,
			})

			expect(result.exitCode).toBe(1)
			expect(result.stderr).toContain("Unknown format: 'xlsx'")
			expect(result.stderr).toContain('Valid formats')
		})

		it('errors on mixed valid and invalid format values', async () => {
			const result = await runCLI(['sample.md', '-f', 'html,rtf'], {
				cwd: tempDir,
				reject: false,
			})

			expect(result.exitCode).toBe(1)
			expect(result.stderr).toContain("Unknown format: 'rtf'")
		})

		it('errors on empty format value', async () => {
			const result = await execa('node', [CLI_PATH, 'sample.md', '--format'], {
				cwd: tempDir,
				reject: false,
			})

			expect(result.exitCode).not.toBe(0)
		})

		it('ignores empty values from trailing comma in format', async () => {
			await runCLI(['sample.md', '-f', 'html,'], {
				cwd: tempDir,
			})

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
		})

		it('ignores empty values from leading comma in format', async () => {
			await runCLI(['sample.md', '-f', ',html'], {
				cwd: tempDir,
			})

			expect(existsSync(join(tempDir, 'sample.html'))).toBe(true)
		})

		it('treats space-separated values as a single unknown format', async () => {
			// "html pdf" is not split — it's treated as one value
			const result = await runCLI(['sample.md', '-f', 'html pdf'], {
				cwd: tempDir,
				reject: false,
			})

			expect(result.exitCode).toBe(1)
			expect(result.stderr).toContain("Unknown format: 'html pdf'")
		})

		it('treats semicolon-separated values as a single unknown format', async () => {
			const result = await runCLI(['sample.md', '-f', 'html;pdf'], {
				cwd: tempDir,
				reject: false,
			})

			expect(result.exitCode).toBe(1)
			expect(result.stderr).toContain("Unknown format: 'html;pdf'")
		})

		it('is case-sensitive (rejects uppercase)', async () => {
			const result = await runCLI(['sample.md', '-f', 'HTML'], {
				cwd: tempDir,
				reject: false,
			})

			expect(result.exitCode).toBe(1)
			expect(result.stderr).toContain("Unknown format: 'HTML'")
		})

		it('--format overrides frontmatter formats', async () => {
			const mdContent = `---
formats:
  - pdf
  - docx
---
# Test Person

Test content`
			writeFileSync(join(tempDir, 'resume.md'), mdContent)

			await runCLI(['resume.md', '--format', 'html'], {
				cwd: tempDir,
			})

			// CLI should win: only HTML, not PDF/DOCX from frontmatter
			expect(existsSync(join(tempDir, 'resume.html'))).toBe(true)
			expect(existsSync(join(tempDir, 'resume.pdf'))).toBe(false)
			expect(existsSync(join(tempDir, 'resume.docx'))).toBe(false)
		})

		it('defaults to PDF when no --format and no frontmatter formats', async () => {
			await runCLI(['sample.md'], {
				cwd: tempDir,
			})

			expect(existsSync(join(tempDir, 'sample.pdf'))).toBe(true)
			expect(existsSync(join(tempDir, 'sample.html'))).toBe(false)
		})
	})

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
themes: formal
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
})
