import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
	loadConfig,
	parseVarFlags,
	mergeVariables,
	generateVariablesCSS,
	getStyleVariables,
	setStyleVariables,
	resetStyleVariables,
	readGlobalConfig,
	writeGlobalConfig,
	getGlobalConfigDir,
	CONFIG_FILENAME,
} from './config.js'

describe('config', () => {
	let tempDir: string

	beforeEach(() => {
		tempDir = join(tmpdir(), `resum8-config-test-${Date.now()}`)
		mkdirSync(tempDir, { recursive: true })
	})

	afterEach(() => {
		if (existsSync(tempDir)) {
			rmSync(tempDir, { recursive: true, force: true })
		}
	})

	describe('loadConfig', () => {
		it('returns null when no config file exists', () => {
			expect(loadConfig(tempDir)).toBeNull()
		})

		it('loads valid config file', () => {
			const config = {
				style: 'formal',
				variables: {
					'font-family': 'Arial',
					'base-font-size': '11pt',
				},
			}
			writeFileSync(
				join(tempDir, CONFIG_FILENAME),
				JSON.stringify(config, null, 2),
			)

			const loaded = loadConfig(tempDir)
			expect(loaded).toEqual(config)
		})

		it('loads config with only style', () => {
			writeFileSync(
				join(tempDir, CONFIG_FILENAME),
				JSON.stringify({ style: 'minimal' }),
			)

			const loaded = loadConfig(tempDir)
			expect(loaded?.style).toBe('minimal')
			expect(loaded?.variables).toBeUndefined()
		})

		it('throws on invalid JSON', () => {
			writeFileSync(join(tempDir, CONFIG_FILENAME), '{ invalid json }')

			expect(() => loadConfig(tempDir)).toThrow('Invalid JSON')
		})

		it('throws on non-string style', () => {
			writeFileSync(
				join(tempDir, CONFIG_FILENAME),
				JSON.stringify({ style: 123 }),
			)

			expect(() => loadConfig(tempDir)).toThrow("'style' must be a string")
		})

		it('throws on non-object variables', () => {
			writeFileSync(
				join(tempDir, CONFIG_FILENAME),
				JSON.stringify({ variables: 'not-an-object' }),
			)

			expect(() => loadConfig(tempDir)).toThrow("'variables' must be an object")
		})

		it('throws on non-string variable value', () => {
			writeFileSync(
				join(tempDir, CONFIG_FILENAME),
				JSON.stringify({ variables: { size: 12 } }),
			)

			expect(() => loadConfig(tempDir)).toThrow(
				"variable 'size' must be a string",
			)
		})
	})

	describe('parseVarFlags', () => {
		it('parses single variable', () => {
			const vars = parseVarFlags(['font-family=Arial'])
			expect(vars).toEqual({ 'font-family': 'Arial' })
		})

		it('parses multiple variables', () => {
			const vars = parseVarFlags(['font-family=Arial', 'base-font-size=11pt'])
			expect(vars).toEqual({
				'font-family': 'Arial',
				'base-font-size': '11pt',
			})
		})

		it('handles values with equals signs', () => {
			const vars = parseVarFlags(['color=rgba(0,0,0,0.5)'])
			expect(vars).toEqual({ color: 'rgba(0,0,0,0.5)' })
		})

		it('throws on missing equals', () => {
			expect(() => parseVarFlags(['invalid'])).toThrow(
				"Invalid --var format: 'invalid'",
			)
		})

		it('throws on empty name', () => {
			expect(() => parseVarFlags(['=value'])).toThrow('Variable name is empty')
		})

		it('allows empty value', () => {
			const vars = parseVarFlags(['name='])
			expect(vars).toEqual({ name: '' })
		})
	})

	describe('mergeVariables', () => {
		it('returns empty object when no variables', () => {
			expect(mergeVariables(undefined, undefined)).toEqual({})
		})

		it('returns config vars when no CLI vars', () => {
			const config = { a: '1', b: '2' }
			expect(mergeVariables(config, undefined)).toEqual(config)
		})

		it('returns CLI vars when no config vars', () => {
			const cli = { a: '1', b: '2' }
			expect(mergeVariables(undefined, cli)).toEqual(cli)
		})

		it('CLI vars override config vars', () => {
			const config = { a: 'config', b: 'config' }
			const cli = { a: 'cli' }
			expect(mergeVariables(config, cli)).toEqual({
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

	describe('global style variables', () => {
		let globalConfigDir: string

		beforeEach(() => {
			globalConfigDir = join(tempDir, '.config', 'resum8')
			mkdirSync(globalConfigDir, { recursive: true })
		})

		describe('getStyleVariables', () => {
			it('returns empty object when no config exists', () => {
				const vars = getStyleVariables('classic', globalConfigDir)
				expect(vars).toEqual({})
			})

			it('returns empty object when style has no variables', () => {
				writeGlobalConfig({ defaultStyle: 'formal' }, globalConfigDir)
				const vars = getStyleVariables('classic', globalConfigDir)
				expect(vars).toEqual({})
			})

			it('returns variables for a style', () => {
				writeGlobalConfig(
					{
						styleVariables: {
							classic: { 'font-family': 'Arial', 'text-color': '#000' },
						},
					},
					globalConfigDir,
				)

				const vars = getStyleVariables('classic', globalConfigDir)
				expect(vars).toEqual({ 'font-family': 'Arial', 'text-color': '#000' })
			})

			it('returns empty object for different style', () => {
				writeGlobalConfig(
					{
						styleVariables: {
							classic: { 'font-family': 'Arial' },
						},
					},
					globalConfigDir,
				)

				const vars = getStyleVariables('formal', globalConfigDir)
				expect(vars).toEqual({})
			})
		})

		describe('setStyleVariables', () => {
			it('creates config and sets variables for new style', () => {
				setStyleVariables(
					'classic',
					{ 'font-family': 'Arial' },
					globalConfigDir,
				)

				const config = readGlobalConfig(globalConfigDir)
				expect(config.styleVariables?.classic).toEqual({
					'font-family': 'Arial',
				})
			})

			it('merges with existing style variables', () => {
				setStyleVariables(
					'classic',
					{ 'font-family': 'Arial' },
					globalConfigDir,
				)
				setStyleVariables('classic', { 'text-color': '#000' }, globalConfigDir)

				const config = readGlobalConfig(globalConfigDir)
				expect(config.styleVariables?.classic).toEqual({
					'font-family': 'Arial',
					'text-color': '#000',
				})
			})

			it('overwrites existing variable value', () => {
				setStyleVariables(
					'classic',
					{ 'font-family': 'Arial' },
					globalConfigDir,
				)
				setStyleVariables(
					'classic',
					{ 'font-family': 'Helvetica' },
					globalConfigDir,
				)

				const config = readGlobalConfig(globalConfigDir)
				expect(config.styleVariables?.classic?.['font-family']).toBe(
					'Helvetica',
				)
			})

			it('preserves other styles when setting variables', () => {
				setStyleVariables(
					'classic',
					{ 'font-family': 'Arial' },
					globalConfigDir,
				)
				setStyleVariables(
					'formal',
					{ 'section-header-color': '#0066cc' },
					globalConfigDir,
				)

				const config = readGlobalConfig(globalConfigDir)
				expect(config.styleVariables?.classic).toEqual({
					'font-family': 'Arial',
				})
				expect(config.styleVariables?.formal).toEqual({
					'section-header-color': '#0066cc',
				})
			})

			it('preserves other config settings', () => {
				writeGlobalConfig({ defaultStyle: 'formal' }, globalConfigDir)
				setStyleVariables(
					'classic',
					{ 'font-family': 'Arial' },
					globalConfigDir,
				)

				const config = readGlobalConfig(globalConfigDir)
				expect(config.defaultStyle).toBe('formal')
				expect(config.styleVariables?.classic).toEqual({
					'font-family': 'Arial',
				})
			})
		})

		describe('resetStyleVariables', () => {
			it('removes variables for a style', () => {
				setStyleVariables(
					'classic',
					{ 'font-family': 'Arial', 'text-color': '#000' },
					globalConfigDir,
				)
				resetStyleVariables('classic', globalConfigDir)

				const config = readGlobalConfig(globalConfigDir)
				expect(config.styleVariables?.classic).toBeUndefined()
			})

			it('preserves other styles when resetting', () => {
				setStyleVariables(
					'classic',
					{ 'font-family': 'Arial' },
					globalConfigDir,
				)
				setStyleVariables(
					'formal',
					{ 'section-header-color': '#0066cc' },
					globalConfigDir,
				)

				resetStyleVariables('classic', globalConfigDir)

				const config = readGlobalConfig(globalConfigDir)
				expect(config.styleVariables?.classic).toBeUndefined()
				expect(config.styleVariables?.formal).toEqual({
					'section-header-color': '#0066cc',
				})
			})

			it('preserves other config settings when resetting', () => {
				writeGlobalConfig({ defaultStyle: 'formal' }, globalConfigDir)
				setStyleVariables(
					'classic',
					{ 'font-family': 'Arial' },
					globalConfigDir,
				)

				resetStyleVariables('classic', globalConfigDir)

				const config = readGlobalConfig(globalConfigDir)
				expect(config.defaultStyle).toBe('formal')
				expect(config.styleVariables?.classic).toBeUndefined()
			})

			it('does nothing if style has no variables', () => {
				writeGlobalConfig({ defaultStyle: 'formal' }, globalConfigDir)

				// Should not throw
				resetStyleVariables('classic', globalConfigDir)

				const config = readGlobalConfig(globalConfigDir)
				expect(config.defaultStyle).toBe('formal')
			})

			it('does nothing if config does not exist', () => {
				// Should not throw
				resetStyleVariables('classic', globalConfigDir)

				const vars = getStyleVariables('classic', globalConfigDir)
				expect(vars).toEqual({})
			})
		})
	})
})
