import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import chalk from 'chalk'
import {
	getBundledThemePath,
	getLocalThemesDir,
	getBundledThemes,
	DEFAULT_THEME,
} from '../lib/themes.js'
import dedent from 'dedent'

export interface EjectCommandOptions {
	force?: boolean
}

/**
 * Eject a bundled theme to local themes directory for customization
 */
export async function ejectCommand(
	themeName: string | undefined,
	options: EjectCommandOptions,
): Promise<void> {
	const cwd = process.cwd()

	const name = themeName ?? DEFAULT_THEME

	// Check if it's a valid bundled theme
	const bundledPath = getBundledThemePath(name)
	if (!bundledPath) {
		console.error(dedent`
			${chalk.red('Error:')} '${name}' is not a bundled theme.
			Available themes: ${getBundledThemes().join(', ')}
		`)
		process.exit(1)
	}

	// Target path
	const localDir = getLocalThemesDir(cwd)
	const localPath = join(localDir, `${name}.css`)

	// Check if already exists
	if (existsSync(localPath) && !options.force) {
		const relativePath = relative(cwd, localPath)
		console.error(dedent`
			${chalk.red(`Error: ${relativePath} already exists.`)}
			Use ${chalk.blue('--force')} to overwrite.
		`)
		process.exit(1)
	}

	// Create parent directories if needed (handles nested paths like common/base)
	const parentDir = dirname(localPath)
	if (!existsSync(parentDir)) {
		mkdirSync(parentDir, { recursive: true })
	}

	// Copy raw theme file (preserving @import statements for runtime resolution)
	try {
		const rawCSS = readFileSync(bundledPath, 'utf-8')
		writeFileSync(localPath, rawCSS)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		console.error(chalk.red(`Error: Failed to eject theme: ${message}`))
		process.exit(1)
	}

	const relativePath = relative(cwd, localPath)
	console.log(dedent`
		${chalk.green('✓')} Ejected ${chalk.cyan(name)} theme to ${chalk.cyan(relativePath)}

		The local copy will now be used when you run:
			${chalk.blue(`m8 resume.md --theme ${name}`)}

		Edit the CSS to customize fonts, colors, and layout.
	`)
}
