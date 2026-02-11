import { describe, it, expect } from 'vitest'
import { parseStyleFlags } from './style-flags.js'

describe('parseStyleFlags', () => {
	it('parses single style', () => {
		const styles = parseStyleFlags(['font-family=Arial'])
		expect(styles).toEqual({ 'font-family': 'Arial' })
	})

	it('parses multiple styles', () => {
		const styles = parseStyleFlags(['font-family=Arial', 'base-font-size=11pt'])
		expect(styles).toEqual({
			'font-family': 'Arial',
			'base-font-size': '11pt',
		})
	})

	it('handles values with equals signs', () => {
		const styles = parseStyleFlags(['color=rgba(0,0,0,0.5)'])
		expect(styles).toEqual({ color: 'rgba(0,0,0,0.5)' })
	})

	it('throws on missing equals', () => {
		expect(() => parseStyleFlags(['invalid'])).toThrow(
			"Invalid --style format: 'invalid'",
		)
	})

	it('throws on empty name', () => {
		expect(() => parseStyleFlags(['=value'])).toThrow('Style name is empty')
	})

	it('allows empty value', () => {
		const styles = parseStyleFlags(['name='])
		expect(styles).toEqual({ name: '' })
	})
})
