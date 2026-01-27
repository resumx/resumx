import { existsSync, copyFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Path to bundled template
const TEMPLATE_PATH = resolve(__dirname, '../../templates/starter.md')
const DEFAULT_OUTPUT = 'resume.md'

export interface InitCommandOptions {
	force?: boolean
}

/**
 * Prompt user for yes/no confirmation
 */
async function confirm(question: string): Promise<boolean> {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	return new Promise(resolve => {
		rl.question(question, answer => {
			rl.close()
			const normalized = answer.toLowerCase().trim()
			resolve(normalized === 'y' || normalized === 'yes')
		})
	})
}

/**
 * Initialize a new resume in the current directory
 */
export async function initCommand(
	filename: string | undefined,
	options: InitCommandOptions,
): Promise<void> {
	const cwd = process.cwd()
	const outputFilename = filename ?? DEFAULT_OUTPUT
	const outputPath = join(cwd, outputFilename)

	// Check if template exists
	if (!existsSync(TEMPLATE_PATH)) {
		console.error(chalk.red('Error: Template file not found in package.'))
		console.error(
			'This might be an installation issue. Try reinstalling resum8.',
		)
		process.exit(1)
	}

	// Check if output already exists
	if (existsSync(outputPath) && !options.force) {
		const shouldOverwrite = await confirm(
			chalk.yellow(`${outputFilename} already exists. Overwrite? [y/N] `),
		)
		if (!shouldOverwrite) {
			console.log('Aborted.')
			return
		}
	}

	// Copy template
	try {
		copyFileSync(TEMPLATE_PATH, outputPath)
		console.log(chalk.green('✓') + ' Created ' + chalk.cyan(outputFilename))
		console.log('')
		console.log('Next steps:')
		console.log(
			'  1. Edit ' + chalk.cyan(outputFilename) + ' with your information',
		)
		console.log(`  2. Run ${chalk.cyan(`m8 ${outputFilename}`)} to build PDF`)
	} catch (error) {
		console.error(chalk.red(`Error: Failed to create ${outputFilename}`))
		console.error((error as Error).message)
		process.exit(1)
	}
}
