import { existsSync, copyFileSync, mkdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import chalk from 'chalk'
import {
	getBundledStylePath,
	getLocalStylesDir,
	BUNDLED_STYLES,
	DEFAULT_STYLE,
} from '../lib/styles.js'

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

	// Default to classic style
	const name = styleName ?? DEFAULT_STYLE

	// Check if it's a valid bundled style
	const bundledPath = getBundledStylePath(name)
	if (!bundledPath) {
		console.error(chalk.red(`Error: '${name}' is not a bundled style.`))
		console.error(`Available styles: ${BUNDLED_STYLES.join(', ')}`)
		process.exit(1)
	}

	// Target path
	const localDir = getLocalStylesDir(cwd)
	const localPath = join(localDir, `${name}.css`)

	// Check if already exists
	if (existsSync(localPath) && !options.force) {
		const relativePath = relative(cwd, localPath)
		console.error(chalk.red(`Error: ${relativePath} already exists.`))
		console.error('Use ' + chalk.cyan('--force') + ' to overwrite.')
		process.exit(1)
	}

	// Create styles directory if needed
	if (!existsSync(localDir)) {
		mkdirSync(localDir, { recursive: true })
	}

	// Copy style
	try {
		copyFileSync(bundledPath, localPath)
		const relativePath = relative(cwd, localPath)
		console.log(
			chalk.green('✓')
				+ ` Ejected ${chalk.cyan(name)} style to ${chalk.cyan(relativePath)}`,
		)
		console.log('')
		console.log('The local copy will now be used when you run:')
		console.log(`  ${chalk.cyan(`m8 resume.md --style ${name}`)}`)
		console.log('')
		console.log('Edit the CSS to customize fonts, colors, and layout.')
	} catch (error) {
		console.error(chalk.red(`Error: Failed to eject style`))
		console.error((error as Error).message)
		process.exit(1)
	}
}
