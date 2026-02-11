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
	themeVariables?: Record<string, Record<string, string>>
}

type ThemeVariables = Record<string, string>

const schema: Schema<GlobalConfig> = {
	defaultTheme: {
		type: 'string',
	},
	themeVariables: {
		type: 'object',
		additionalProperties: {
			type: 'object',
			additionalProperties: { type: 'string' },
		},
	},
}

const defaults: GlobalConfig = {
	defaultTheme: DEFAULT_THEME,
	themeVariables: {},
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

	/** Get theme variable overrides */
	getThemeVariables(theme: string): ThemeVariables

	/** Set theme variables (merges with existing) */
	setThemeVariables(theme: string, vars: ThemeVariables): void

	/** Clear all variables for a theme */
	resetThemeVariables(theme: string): void

	/** Clear entire config */
	clear(): void
}

/**
 * Create a config store.
 * @param cwd - Config directory. Defaults to ~/.config/resum8 (pass custom path for testing).
 */
export function createConfigStore(
	cwd = process.env['RESUM8_CONFIG_DIR']
		?? join(homedir(), '.config', 'resum8'),
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

		getThemeVariables(theme: string): ThemeVariables {
			return (conf.get(`themeVariables.${theme}`) as ThemeVariables) ?? {}
		},

		setThemeVariables(theme: string, vars: ThemeVariables): void {
			const existing = this.getThemeVariables(theme)
			conf.set(`themeVariables.${theme}`, { ...existing, ...vars })
		},

		resetThemeVariables(theme: string): void {
			const all = conf.get('themeVariables') ?? {}
			delete all[theme]
			conf.set('themeVariables', all)
		},

		clear(): void {
			conf.clear()
		},
	}
}

/** Default config store singleton */
export const config = createConfigStore()
