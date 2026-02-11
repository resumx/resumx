import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createConfigStore } from './config.js'
import {
	mergeVariables,
	generateVariablesCSS,
	DEFAULT_THEME,
} from './themes.js'

describe('config', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resumx-config-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	describe('mergeVariables', () => {
		it('returns empty object when no variables', () => {
			expect(mergeVariables(undefined, undefined)).toEqual({})
		})

		it('returns config vars when no CLI vars', () => {
			const configVars = { a: '1', b: '2' }
			expect(mergeVariables(configVars, undefined)).toEqual(configVars)
		})

		it('returns CLI vars when no config vars', () => {
			const cli = { a: '1', b: '2' }
			expect(mergeVariables(undefined, cli)).toEqual(cli)
		})

		it('CLI vars override config vars', () => {
			const configVars = { a: 'config', b: 'config' }
			const cli = { a: 'cli' }
			expect(mergeVariables(configVars, cli)).toEqual({
				a: 'cli',
				b: 'config',
			})
		})
	})

	describe('generateVariablesCSS', () => {
		it('returns empty string for empty variables', () => {
			expect(generateVariablesCSS({})).toBe('')
		})

		it('generates CSS variables block', () => {
			const css = generateVariablesCSS({
				'font-family': 'Arial',
				'base-font-size': '11pt',
			})

			expect(css).toContain(':root {')
			expect(css).toContain('--font-family: Arial;')
			expect(css).toContain('--base-font-size: 11pt;')
			expect(css).toContain('}')
		})
	})

	describe('ConfigStore', () => {
		let configDir: string

		beforeEach(() => {
			configDir = join(tempDir, '.config', 'resumx')
			mkdirSync(configDir, { recursive: true })
		})

		describe('getThemeStyles', () => {
			it('returns empty object when no config exists', () => {
				const store = createConfigStore(configDir)
				expect(store.getThemeStyles('classic')).toEqual({})
			})

			it('returns empty object when theme has no styles', () => {
				const store = createConfigStore(configDir)
				store.defaultTheme = 'formal'
				expect(store.getThemeStyles('classic')).toEqual({})
			})

			it('returns styles for a theme', () => {
				const store = createConfigStore(configDir)
				store.setThemeStyles('classic', {
					'font-family': 'Arial',
					'text-color': '#000',
				})

				expect(store.getThemeStyles('classic')).toEqual({
					'font-family': 'Arial',
					'text-color': '#000',
				})
			})

			it('returns empty object for different theme', () => {
				const store = createConfigStore(configDir)
				store.setThemeStyles('classic', { 'font-family': 'Arial' })

				expect(store.getThemeStyles('formal')).toEqual({})
			})
		})

		describe('setThemeStyles', () => {
			it('creates config and sets styles for new theme', () => {
				const store = createConfigStore(configDir)
				store.setThemeStyles('classic', { 'font-family': 'Arial' })

				expect(store.store.themeStyles?.classic).toEqual({
					'font-family': 'Arial',
				})
			})

			it('merges with existing theme styles', () => {
				const store = createConfigStore(configDir)
				store.setThemeStyles('classic', { 'font-family': 'Arial' })
				store.setThemeStyles('classic', { 'text-color': '#000' })

				expect(store.store.themeStyles?.classic).toEqual({
					'font-family': 'Arial',
					'text-color': '#000',
				})
			})

			it('overwrites existing style value', () => {
				const store = createConfigStore(configDir)
				store.setThemeStyles('classic', { 'font-family': 'Arial' })
				store.setThemeStyles('classic', { 'font-family': 'Helvetica' })

				expect(store.store.themeStyles?.classic?.['font-family']).toBe(
					'Helvetica',
				)
			})

			it('preserves other themes when setting styles', () => {
				const store = createConfigStore(configDir)
				store.setThemeStyles('classic', { 'font-family': 'Arial' })
				store.setThemeStyles('formal', { 'section-header-color': '#0066cc' })

				expect(store.store.themeStyles?.classic).toEqual({
					'font-family': 'Arial',
				})
				expect(store.store.themeStyles?.formal).toEqual({
					'section-header-color': '#0066cc',
				})
			})

			it('preserves other config settings', () => {
				const store = createConfigStore(configDir)
				store.defaultTheme = 'formal'
				store.setThemeStyles('classic', { 'font-family': 'Arial' })

				expect(store.defaultTheme).toBe('formal')
				expect(store.store.themeStyles?.classic).toEqual({
					'font-family': 'Arial',
				})
			})
		})

		describe('resetThemeStyles', () => {
			it('removes styles for a theme', () => {
				const store = createConfigStore(configDir)
				store.setThemeStyles('classic', {
					'font-family': 'Arial',
					'text-color': '#000',
				})
				store.resetThemeStyles('classic')

				expect(store.store.themeStyles?.classic).toBeUndefined()
			})

			it('preserves other themes when resetting', () => {
				const store = createConfigStore(configDir)
				store.setThemeStyles('classic', { 'font-family': 'Arial' })
				store.setThemeStyles('formal', { 'section-header-color': '#0066cc' })

				store.resetThemeStyles('classic')

				expect(store.store.themeStyles?.classic).toBeUndefined()
				expect(store.store.themeStyles?.formal).toEqual({
					'section-header-color': '#0066cc',
				})
			})

			it('preserves other config settings when resetting', () => {
				const store = createConfigStore(configDir)
				store.defaultTheme = 'formal'
				store.setThemeStyles('classic', { 'font-family': 'Arial' })

				store.resetThemeStyles('classic')

				expect(store.defaultTheme).toBe('formal')
				expect(store.store.themeStyles?.classic).toBeUndefined()
			})

			it('does nothing if theme has no styles', () => {
				const store = createConfigStore(configDir)
				store.defaultTheme = 'formal'

				// Should not throw
				store.resetThemeStyles('classic')

				expect(store.defaultTheme).toBe('formal')
			})

			it('does nothing if config does not exist', () => {
				const store = createConfigStore(configDir)

				// Should not throw
				store.resetThemeStyles('classic')

				expect(store.getThemeStyles('classic')).toEqual({})
			})
		})

		describe('defaultTheme', () => {
			it('returns default when not set', () => {
				const store = createConfigStore(configDir)
				expect(store.defaultTheme).toBe(DEFAULT_THEME)
			})

			it('can be set and retrieved', () => {
				const store = createConfigStore(configDir)
				store.defaultTheme = 'modern'
				expect(store.defaultTheme).toBe('modern')
			})

			it('can be reset with resetDefaultTheme()', () => {
				const store = createConfigStore(configDir)
				store.defaultTheme = 'modern'
				store.resetDefaultTheme()
				expect(store.defaultTheme).toBe(DEFAULT_THEME)
			})
		})

		describe('path', () => {
			it('returns config file path', () => {
				const store = createConfigStore(configDir)
				expect(store.path).toContain('config.json')
				expect(store.path).toContain(configDir)
			})
		})

		describe('clear', () => {
			it('clears all config', () => {
				const store = createConfigStore(configDir)
				store.defaultTheme = 'modern'
				store.setThemeStyles('classic', { color: 'red' })

				store.clear()

				// clear() wipes file; conf returns defaults for missing keys
				expect(store.defaultTheme).toBe(DEFAULT_THEME)
				expect(store.getThemeStyles('classic')).toEqual({})
			})
		})
	})
})
