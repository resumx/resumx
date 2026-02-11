import chalk from 'chalk'
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { listThemes, parseCssVariables, type ThemeInfo } from '../lib/themes.js'
import { config, type ConfigStore } from '../lib/config.js'
import { parseStyleFlags } from './utils/style-flags.js'
import dedent from 'dedent'

export interface ThemeCommandOptions {
	default?: string
	style?: string[]
	set?: string[] // CLI uses --set to avoid conflict with main program's --style
	reset?: string // Reset a specific theme style to default
	resetAll?: boolean // Reset all theme style overrides to defaults
}

/** Context passed to theme subcommands. */
interface ThemeContext {
	cwd: string
	store: ConfigStore
}

/** Resolve theme by name. Returns null when not found. */
function getTheme(themeName: string, cwd: string): ThemeInfo | null {
	const themes = listThemes(cwd)
	return themes.find(s => s.name === themeName) ?? null
}

/**
 * Resolve theme by name or exit with error.
 * Single place for "theme not found" exit so the CLI layer owns process.exit.
 */
function requireTheme(themeName: string, ctx: ThemeContext): ThemeInfo {
	const theme = getTheme(themeName, ctx.cwd)
	if (!theme) {
		console.error(formatThemeNotFoundError(themeName, listThemes(ctx.cwd)))
		process.exit(1)
	}
	return theme
}

/**
 * Theme command - list themes or set default
 *
 * Usage:
 *   resumx theme                                  # list themes
 *   resumx theme --default classic                # set default theme
 *   resumx theme classic                          # show theme info
 *   resumx theme classic --set key=value          # set default variable override
 *   resumx theme classic --reset font-family      # reset specific variable to default
 *   resumx theme classic --reset-all              # reset all variables to defaults
 */
export async function themeCommand(
	themeName: string | undefined,
	options: ThemeCommandOptions,
	store: ConfigStore = config,
): Promise<void> {
	const ctx: ThemeContext = {
		cwd: process.cwd(),
		store,
	}

	if (options.default) {
		await setDefaultTheme(options.default, ctx)
		return
	}

	if (options.resetAll) {
		if (!themeName) {
			console.error(
				formatThemeNameRequired(
					'--reset-all',
					'resumx theme <name> --reset-all',
				),
			)
			process.exit(1)
		}
		await resetAllThemeStyleOverrides(themeName, ctx)
		return
	}

	if (options.reset) {
		if (!themeName) {
			console.error(
				formatThemeNameRequired(
					'--reset',
					'resumx theme <name> --reset <variable-name>',
				),
			)
			process.exit(1)
		}
		await resetSingleThemeStyleOverride(themeName, options.reset, ctx)
		return
	}

	if (options.style && options.style.length > 0) {
		if (!themeName) {
			console.error(
				formatThemeNameRequired(
					'--style',
					'resumx theme <name> --style key=value',
				),
			)
			process.exit(1)
		}
		await setThemeStyleOverrides(themeName, options.style, ctx)
		return
	}

	if (themeName) {
		await showThemeInfo(themeName, ctx)
		return
	}

	await listAllThemes(ctx.cwd)
}

/** Reset all style overrides for a theme. */
async function resetAllThemeStyleOverrides(
	themeName: string,
	ctx: ThemeContext,
): Promise<void> {
	requireTheme(themeName, ctx)
	ctx.store.resetThemeStyles(themeName)
	console.log(dedent`
		All style overrides cleared for ${chalk.cyan(themeName)}

		${chalk.dim('Theme will now use original default values.')}
	`)
}

/** Reset a single style override for a theme. */
async function resetSingleThemeStyleOverride(
	themeName: string,
	styleName: string,
	ctx: ThemeContext,
): Promise<void> {
	requireTheme(themeName, ctx)
	const currentOverrides = ctx.store.getThemeStyles(themeName)

	// Check if the style has an override
	if (!currentOverrides[styleName]) {
		const overrideKeys = Object.keys(currentOverrides)
		console.error(dedent.withOptions({ alignValues: true })`
			${chalk.red(`Error: No override found for style '${styleName}' in theme '${themeName}'.`)}

			Current overrides:
			  ${overrideKeys.length > 0 ? overrideKeys.map(k => chalk.cyan(`--${k}`)).join('\n') : chalk.dim('(none)')}
		`)
		process.exit(1)
	}

	// Remove the specific style
	const updatedOverrides = { ...currentOverrides }
	delete updatedOverrides[styleName]

	if (Object.keys(updatedOverrides).length === 0) {
		ctx.store.resetThemeStyles(themeName)
	} else {
		// Get current themeStyles and update just this theme
		const allThemeStyles = ctx.store.store.themeStyles ?? {}
		const newStore = { ...allThemeStyles, [themeName]: updatedOverrides }
		// Clear and re-set to replace (not merge)
		ctx.store.resetThemeStyles(themeName)
		ctx.store.setThemeStyles(themeName, updatedOverrides)
	}

	console.log(dedent`
		Style override ${chalk.cyan(`--${styleName}`)} cleared for ${chalk.cyan(themeName)}

		${chalk.dim('Style will now use its original default value.')}
	`)
}

/** Set style overrides for a theme. */
async function setThemeStyleOverrides(
	themeName: string,
	styleFlags: string[],
	ctx: ThemeContext,
): Promise<void> {
	requireTheme(themeName, ctx)
	const styles = parseStyleFlags(styleFlags)
	ctx.store.setThemeStyles(themeName, styles)

	console.log(dedent.withOptions({ alignValues: true })`
		Default style overrides saved for ${chalk.cyan(themeName)}:

		  ${Object.entries(styles)
				.map(([key, value]) => `${chalk.cyan(`--${key}`)}: ${value}`)
				.join('\n')}

		${chalk.dim('These will be applied when rendering with this theme.')}
	`)
}

/** Show info for a specific theme including configurable variables. */
async function showThemeInfo(
	themeName: string,
	ctx: ThemeContext,
): Promise<void> {
	const theme = requireTheme(themeName, ctx)
	const css = readFileSync(theme.path, 'utf-8')
	const variables = parseCssVariables(css)
	const savedOverrides = ctx.store.getThemeStyles(themeName)

	console.log(
		chalk.bold(
			`Theme: ${chalk.cyan(themeName)}${theme.isLocal ? ` (overridden in ${relative(ctx.cwd, theme.path)})` : ''}\n`,
		),
	)

	if (variables.length === 0) {
		console.log(chalk.dim('No configurable CSS variables found.'))
	} else {
		console.log(chalk.bold('Configurable variables:'))
		for (const v of variables) {
			const varName = v.name.slice(2) // Remove -- prefix
			const override = savedOverrides[varName]

			console.log(`    ${chalk.cyan(varName)}`)
			if (override && override !== v.value) {
				console.log(
					`      ${chalk.dim(v.value)} ${chalk.yellow('→')} ${chalk.green(override)}`,
				)
			} else {
				console.log(`      ${chalk.dim(v.value)}`)
			}
		}
	}
	console.log('')
	console.log(dedent`
		Override with:
		    ${chalk.blue(`resumx resume.md --style ${variables[0]?.name.slice(2) ?? 'font-family'}="value"`)}

		Set default override:
		    ${chalk.blue(`resumx theme ${themeName} --set ${variables[0]?.name.slice(2) ?? 'font-family'}="value"`)}

		Reset specific variable:
		    ${chalk.blue(`resumx theme ${themeName} --reset ${variables[0]?.name.slice(2) ?? 'font-family'}`)}

		Reset all overrides:
		    ${chalk.blue(`resumx theme ${themeName} --reset-all`)}

		Or customize fully:
		    ${chalk.blue(`resumx eject ${themeName}`)}
	`)
}

/** Set the global default theme. */
async function setDefaultTheme(
	themeName: string,
	ctx: ThemeContext,
): Promise<void> {
	requireTheme(themeName, ctx)
	ctx.store.defaultTheme = themeName

	console.log(dedent`
		Default theme set to ${chalk.cyan(themeName)}
		${chalk.dim(`Config saved to ${config.path}`)}
	`)
}

/** List all available themes. */
async function listAllThemes(cwd: string): Promise<void> {
	const themes = listThemes(cwd)
	const defaultTheme = config.defaultTheme

	console.log(chalk.bold('Available themes:'))

	for (const s of themes) {
		const isDefault = s.name === defaultTheme
		const themeNameStr = isDefault ? chalk.cyan(s.name) : s.name
		let markerStr =
			s.isLocal ? chalk.yellow(` (overridden in ${relative(cwd, s.path)})`) : ''
		console.log(`    ${themeNameStr}${markerStr}`)
	}
	console.log('')

	console.log(dedent`
		Usage:
		    ${chalk.blue('resumx resume.md --theme <name>')}

		View theme details:
		    ${chalk.blue('resumx theme <name>')}

		Set default theme:
		    ${chalk.blue('resumx theme --default <name>')}

		Customize a theme:
		    ${chalk.blue('resumx eject <name>')}  Copy to ./themes/ for editing
	`)
}

/** Format "theme not found" error message. */
function formatThemeNotFoundError(
	notFoundThemeName: string,
	availableThemes: ThemeInfo[],
): string {
	return dedent.withOptions({ alignValues: true })`
		${chalk.red(`Error: Theme '${notFoundThemeName}' not found.`)}

		Available themes:
		    ${availableThemes.map(s => s.name).join('\n')}
	`
}

/** Format "theme name required" error message. */
function formatThemeNameRequired(
	optionName: string,
	usageExample: string,
): string {
	return dedent`
		${chalk.red(`Error: A theme name is required when using ${optionName}`)}

		Usage:
		    ${chalk.blue(usageExample)}
	`
}
