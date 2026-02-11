import Conf from 'conf'
import type { Schema } from 'conf'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_THEME } from './themes.js'

// =============================================================================
// Types
// =============================================================================

export interface GlobalConfig {
	defaultTheme?: string
	themeStyles?: Record<string, Record<string, string>>
}

type ThemeStyles = Record<string, string>

const schema: Schema<GlobalConfig> = {
	defaultTheme: {
		type: 'string',
	},
	themeStyles: {
		type: 'object',
		additionalProperties: {
			type: 'object',
			additionalProperties: { type: 'string' },
		},
	},
}

const defaults: GlobalConfig = {
	defaultTheme: DEFAULT_THEME,
	themeStyles: {},
}

export interface ConfigStore {
	/** Full path to config file */
	readonly path: string

	/** Raw config object */
	readonly store: GlobalConfig

	/** Default theme name (use resetDefaultTheme to restore default) */
	defaultTheme: string

	/** Set default theme back to DEFAULT_THEME (explicit set; conf does not restore defaults on delete). */
	resetDefaultTheme(): void

	/** Get theme style overrides */
	getThemeStyles(theme: string): ThemeStyles

	/** Set theme styles (merges with existing) */
	setThemeStyles(theme: string, styles: ThemeStyles): void

	/** Clear all styles for a theme */
	resetThemeStyles(theme: string): void

	/** Clear entire config */
	clear(): void
}

/**
 * Create a config store.
 * @param cwd - Config directory. Defaults to ~/.config/resumx (pass custom path for testing).
 */
export function createConfigStore(
	cwd = process.env['RESUMX_CONFIG_DIR']
		?? join(homedir(), '.config', 'resumx'),
): ConfigStore {
	const conf = new Conf<GlobalConfig>({
		cwd,
		configName: 'config',
		schema,
		defaults,
	})

	return {
		get path() {
			return conf.path
		},

		get store() {
			return conf.store
		},

		get defaultTheme() {
			return conf.get('defaultTheme') as string
		},

		set defaultTheme(value: string) {
			conf.set('defaultTheme', value)
		},

		resetDefaultTheme(): void {
			conf.set('defaultTheme', DEFAULT_THEME)
		},

		getThemeStyles(theme: string): ThemeStyles {
			return (conf.get(`themeStyles.${theme}`) as ThemeStyles) ?? {}
		},

		setThemeStyles(theme: string, styles: ThemeStyles): void {
			const existing = this.getThemeStyles(theme)
			conf.set(`themeStyles.${theme}`, { ...existing, ...styles })
		},

		resetThemeStyles(theme: string): void {
			const all = conf.get('themeStyles') ?? {}
			delete all[theme]
			conf.set('themeStyles', all)
		},

		clear(): void {
			conf.clear()
		},
	}
}

/** Default config store singleton */
export const config = createConfigStore()
