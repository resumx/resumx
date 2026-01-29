import chalk from 'chalk'
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import {
	listStyles,
	getDefaultStyle,
	parseCssVariables,
} from '../lib/styles.js'
import {
	writeGlobalConfig,
	readGlobalConfig,
	getConfigPath,
	parseVarFlags,
	setStyleVariables,
	resetStyleVariables,
	getStyleVariables,
} from '../lib/config.js'
import dedent from 'dedent'

export interface StyleCommandOptions {
	default?: string
	var?: string[]
	set?: string[] // CLI uses --set to avoid conflict with main program's --var
	reset?: string // Reset a specific style variable to default
	resetAll?: boolean // Reset all style variables to defaults
	_configDir?: string // For testing
}

/**
 * Style command - list styles or set default
 *
 * Usage:
 *   m8 style                                  # list styles
 *   m8 style --default classic                # set default style
 *   m8 style classic                          # show style info
 *   m8 style classic --set key=value          # set default variable override
 *   m8 style classic --reset font-family      # reset specific variable to default
 *   m8 style classic --reset-all              # reset all variables to defaults
 */
export async function styleCommand(
	styleName: string | undefined,
	options: StyleCommandOptions,
): Promise<void> {
	const cwd = process.cwd()

	// Set default style
	if (options.default) {
		await setDefaultStyle(options.default, cwd, options._configDir)
		return
	}

	// Reset all style variables (requires style name)
	if (options.resetAll) {
		if (!styleName) {
			console.error(dedent`
				${chalk.red('Error: A style name is required when using --reset-all')}

				Usage:
				  ${chalk.blue('m8 style <name> --reset-all')}
			`)
			process.exit(1)
			return // For testing where process.exit is mocked
		}

		await resetAllStyleVarOverrides(styleName, cwd, options._configDir)
		return
	}

	// Reset specific style variable (requires style name)
	if (options.reset) {
		if (!styleName) {
			console.error(dedent`
				${chalk.red('Error: A style name is required when using --reset')}

				Usage:
				  ${chalk.blue('m8 style <name> --reset <variable-name>')}
			`)
			process.exit(1)
			return // For testing where process.exit is mocked
		}

		await resetSingleStyleVarOverride(
			styleName,
			options.reset,
			cwd,
			options._configDir,
		)
		return
	}

	// Set variable overrides (requires style name)
	if (options.var && options.var.length > 0) {
		if (!styleName) {
			console.error(dedent`
				${chalk.red('Error: A style name is required when using --var')}

				Usage:
				  ${chalk.blue('m8 style <name> --var key=value')}
			`)
			process.exit(1)
			return // For testing where process.exit is mocked
		}

		await setStyleVarOverrides(styleName, options.var, cwd, options._configDir)
		return
	}

	// Show style info
	if (styleName) {
		await showStyleInfo(styleName, cwd, options._configDir)
		return
	}

	// List all styles
	await listAllStyles(cwd)
}

/**
 * Reset all variable overrides for a style
 */
async function resetAllStyleVarOverrides(
	styleName: string,
	cwd: string,
	configDir?: string,
): Promise<void> {
	// Validate style exists
	const styles = listStyles(cwd)
	const style = styles.find(s => s.name === styleName)

	if (!style) {
		console.error(dedent.withOptions({ alignValues: true })`
			${chalk.red(`Error: Style '${styleName}' not found.`)}

			Available styles:
			  ${styles.map(s => `${s.name}`).join('\n')}
		`)
		process.exit(1)
		return // For testing where process.exit is mocked
	}

	// Clear saved variables
	resetStyleVariables(styleName, configDir)
	console.log(dedent`
		All variable overrides cleared for ${chalk.cyan(styleName)}

		${chalk.dim('Style will now use original default values.')}
	`)
}

/**
 * Reset a single variable override for a style
 */
async function resetSingleStyleVarOverride(
	styleName: string,
	varName: string,
	cwd: string,
	configDir?: string,
): Promise<void> {
	// Validate style exists
	const styles = listStyles(cwd)
	const style = styles.find(s => s.name === styleName)

	if (!style) {
		console.error(dedent.withOptions({ alignValues: true })`
			${chalk.red(`Error: Style '${styleName}' not found.`)}

			Available styles:
			  ${styles.map(s => `${s.name}`).join('\n')}
		`)
		process.exit(1)
		return // For testing where process.exit is mocked
	}

	// Get current overrides
	const currentOverrides = getStyleVariables(styleName, configDir)

	// Check if the variable has an override
	if (!currentOverrides[varName]) {
		const overrideKeys = Object.keys(currentOverrides)
		console.error(dedent.withOptions({ alignValues: true })`
			${chalk.red(`Error: No override found for variable '${varName}' in style '${styleName}'.`)}

			Current overrides:
			  ${overrideKeys.length > 0 ? overrideKeys.map(k => chalk.cyan(`--${k}`)).join('\n') : chalk.dim('(none)')}
		`)
		process.exit(1)
		return // For testing where process.exit is mocked
	}

	// Remove the specific variable
	const updatedOverrides = { ...currentOverrides }
	delete updatedOverrides[varName]

	// Update the config with remaining overrides
	// If no overrides remain, reset entirely
	if (Object.keys(updatedOverrides).length === 0) {
		resetStyleVariables(styleName, configDir)
	} else {
		// Get current config and merge properly
		const config = readGlobalConfig(configDir)
		const updatedStyleVariables = {
			...config.styleVariables,
			[styleName]: updatedOverrides,
		}
		writeGlobalConfig({ styleVariables: updatedStyleVariables }, configDir)
	}

	console.log(dedent`
		Variable override ${chalk.cyan(`--${varName}`)} cleared for ${chalk.cyan(styleName)}

		${chalk.dim('Variable will now use its original default value.')}
	`)
}

/**
 * Set variable overrides for a style
 */
async function setStyleVarOverrides(
	styleName: string,
	varFlags: string[],
	cwd: string,
	configDir?: string,
): Promise<void> {
	// Validate style exists
	const styles = listStyles(cwd)
	const style = styles.find(s => s.name === styleName)

	if (!style) {
		console.error(dedent.withOptions({ alignValues: true })`
			${chalk.red(`Error: Style '${styleName}' not found.`)}

			Available styles:
			  ${styles.map(s => `${s.name}`).join('\n')}

		`)
		process.exit(1)
		return // For testing where process.exit is mocked
	}

	// Parse and save variables
	const variables = parseVarFlags(varFlags)
	setStyleVariables(styleName, variables, configDir)

	console.log(dedent.withOptions({ alignValues: true })`
		Default variable overrides saved for ${chalk.cyan(styleName)}:

		  ${Object.entries(variables)
				.map(([key, value]) => `${chalk.cyan(`--${key}`)}: ${value}`)
				.join('\n')}

		${chalk.dim('These will be applied when rendering with this style.')}
	`)
}

/**
 * Show info for a specific style including configurable variables
 */
async function showStyleInfo(
	styleName: string,
	cwd: string,
	configDir?: string,
): Promise<void> {
	// Find the style
	const styles = listStyles(cwd)
	const style = styles.find(s => s.name === styleName)

	if (!style) {
		console.error(chalk.red(`Error: Style '${styleName}' not found.`))
		console.log(dedent.withOptions({ alignValues: true })`

			Available styles:
			  ${styles.map(s => `${s.name}`).join('\n')}
		`)
		process.exit(1)
		return // For testing where process.exit is mocked
	}

	// Read and parse CSS variables
	const css = readFileSync(style.path, 'utf-8')
	const variables = parseCssVariables(css)

	// Get saved variable overrides
	const savedOverrides = getStyleVariables(styleName, configDir)
	const hasSavedOverrides = Object.keys(savedOverrides).length > 0

	// Display style info
	if (style.isLocal) {
		const relativePath = relative(cwd, style.path)
		console.log(
			`${chalk.bold(`Style: ${styleName}`)} ${chalk.yellow(`(overridden in ${relativePath})`)}`,
		)
	} else {
		console.log(chalk.bold(`Style: ${styleName}`))
	}

	if (variables.length === 0) {
		console.log(chalk.dim('No configurable CSS variables found.'))
	} else {
		console.log(chalk.bold('Configurable variables:'))
		console.log('')
		for (const v of variables) {
			const varName = v.name.slice(2) // Remove -- prefix
			const override = savedOverrides[varName]

			console.log(`  ${chalk.cyan(varName)}`)
			if (override && override !== v.value) {
				console.log(
					`    ${chalk.dim(v.value)} ${chalk.yellow('→')} ${chalk.green(override)}`,
				)
			} else {
				console.log(`    ${chalk.dim(v.value)}`)
			}
		}
	}
	console.log(dedent`
		Override with:
		  ${chalk.blue(`m8 resume.md --var ${variables[0]?.name.slice(2) ?? 'font-family'}="value"`)}

		Set default override:
		  ${chalk.blue(`m8 style ${styleName} --set ${variables[0]?.name.slice(2) ?? 'font-family'}="value"`)}

		Reset specific variable:
		  ${chalk.blue(`m8 style ${styleName} --reset ${variables[0]?.name.slice(2) ?? 'font-family'}`)}

		Reset all overrides:
		  ${chalk.blue(`m8 style ${styleName} --reset-all`)}

		Or customize fully:
		  ${chalk.blue(`m8 eject ${styleName}`)}
	`)
}

/**
 * Set the global default style
 */
async function setDefaultStyle(
	styleName: string,
	cwd: string,
	configDir?: string,
): Promise<void> {
	// Validate style exists
	const styles = listStyles(cwd)
	const styleExists = styles.some(s => s.name === styleName)

	if (!styleExists) {
		console.error(dedent.withOptions({ alignValues: true })`
			${chalk.red(`Error: Style '${styleName}' not found.`)}

			Available styles:
			  ${styles.map(s => `${s.name}`).join('\n')}
		`)
		process.exit(1)
	}

	// Write to global config
	writeGlobalConfig({ defaultStyle: styleName }, configDir)

	console.log(dedent`
		Default style set to ${chalk.cyan(styleName)}
		${chalk.dim(`Config saved to ${getConfigPath()}`)}
	`)
}

/**
 * List all available styles
 */
async function listAllStyles(cwd: string): Promise<void> {
	const styles = listStyles(cwd)
	const defaultStyle = getDefaultStyle()

	console.log(chalk.bold('Available styles:'))
	console.log('')

	for (const style of styles) {
		const isDefault = style.name === defaultStyle

		const name = isDefault ? chalk.cyan(style.name) : style.name
		let markerStr = ''
		if (style.isLocal) {
			const relativePath = relative(cwd, style.path)
			markerStr = chalk.yellow(` (overridden in ${relativePath})`)
		}

		console.log(`  ${name}${markerStr}`)
	}

	console.log(dedent`
		Usage:
		  ${chalk.blue('m8 resume.md --style <name>')}

		View style details:
		  ${chalk.blue('m8 style <name>')}

		Set default style:
		  ${chalk.blue('m8 style --default <name>')}

		Customize a style:
		  ${chalk.blue('m8 eject <name>')}  Copy to ./styles/ for editing
	`)
}
