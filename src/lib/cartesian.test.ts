import { describe, expect, it } from 'vitest'
import { cartesian } from './cartesian.js'

describe('cartesian', () => {
	it('produces all combinations of two arrays', () => {
		expect(cartesian(['a', 'b'], [1, 2])).toEqual([
			['a', 1],
			['a', 2],
			['b', 1],
			['b', 2],
		])
	})

	it('produces all combinations of three arrays', () => {
		expect(cartesian(['x'], ['a', 'b'], [1, 2])).toEqual([
			['x', 'a', 1],
			['x', 'a', 2],
			['x', 'b', 1],
			['x', 'b', 2],
		])
	})

	it('returns single-element tuples for one array', () => {
		expect(cartesian(['a', 'b', 'c'])).toEqual([['a'], ['b'], ['c']])
	})

	it('returns empty array when any input array is empty', () => {
		expect(cartesian(['a', 'b'], [])).toEqual([])
		expect(cartesian([], [1, 2])).toEqual([])
	})

	it('handles single-element arrays', () => {
		expect(cartesian(['a'], [1])).toEqual([['a', 1]])
	})

	it('preserves undefined values in arrays', () => {
		expect(cartesian([undefined, 'a'], [1])).toEqual([
			[undefined, 1],
			['a', 1],
		])
	})
})
