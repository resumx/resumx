import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import chalk from 'chalk'
import {
	getBundledStylePath,
	getLocalStylesDir,
	BUNDLED_STYLES,
	FALLBACK_DEFAULT_STYLE,
} from '../lib/styles.js'
import dedent from 'dedent'

export interface EjectCommandOptions {
	force?: boolean
}

/**
 * Eject a bundled style to local styles directory for customization
 */
export async function ejectCommand(
	styleName: string | undefined,
	options: EjectCommandOptions,
): Promise<void> {
	const cwd = process.cwd()

	const name = styleName ?? FALLBACK_DEFAULT_STYLE

	// Check if it's a valid bundled style
	const bundledPath = getBundledStylePath(name)
	if (!bundledPath) {
		console.error(dedent`
			${chalk.red('Error:')} '${name}' is not a bundled style.
			Available styles: ${BUNDLED_STYLES.join(', ')}
		`)
		process.exit(1)
	}

	// Target path
	const localDir = getLocalStylesDir(cwd)
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

	// Copy raw style file (preserving @import statements for runtime resolution)
	try {
		const rawCSS = readFileSync(bundledPath, 'utf-8')
		writeFileSync(localPath, rawCSS)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		console.error(chalk.red(`Error: Failed to eject style: ${message}`))
		process.exit(1)
	}

	const relativePath = relative(cwd, localPath)
	console.log(dedent`
		${chalk.green('✓')} Ejected ${chalk.cyan(name)} style to ${chalk.cyan(relativePath)}

		The local copy will now be used when you run:
			${chalk.blue(`m8 resume.md --style ${name}`)}

		Edit the CSS to customize fonts, colors, and layout.
	`)
}
