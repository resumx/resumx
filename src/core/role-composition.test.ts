import { describe, it, expect } from 'vitest'
import { resolveRoleSet } from './role-composition.js'

describe('resolveRoleSet', () => {
	describe('when role has no composition', () => {
		it('returns a set containing only the role itself', () => {
			const result = resolveRoleSet('frontend', {})
			expect(result).toEqual(new Set(['frontend']))
		})

		it('returns a set containing only the role when map has unrelated entries', () => {
			const result = resolveRoleSet('frontend', {
				fullstack: ['backend', 'devops'],
			})
			expect(result).toEqual(new Set(['frontend']))
		})
	})

	describe('when role is a simple composition', () => {
		it('expands to constituents plus itself', () => {
			const result = resolveRoleSet('fullstack', {
				fullstack: ['frontend', 'backend'],
			})
			expect(result).toEqual(new Set(['fullstack', 'frontend', 'backend']))
		})

		it('expands a single-constituent composition', () => {
			const result = resolveRoleSet('senior', {
				senior: ['backend'],
			})
			expect(result).toEqual(new Set(['senior', 'backend']))
		})
	})

	describe('when role has recursive composition', () => {
		it('expands transitively through nested compositions', () => {
			const result = resolveRoleSet('startup-cto', {
				fullstack: ['frontend', 'backend'],
				'startup-cto': ['fullstack', 'leadership'],
			})
			expect(result).toEqual(
				new Set([
					'startup-cto',
					'fullstack',
					'frontend',
					'backend',
					'leadership',
				]),
			)
		})

		it('expands three levels deep', () => {
			const result = resolveRoleSet('mega', {
				base: ['core'],
				mid: ['base', 'extra'],
				mega: ['mid', 'top'],
			})
			expect(result).toEqual(
				new Set(['mega', 'mid', 'base', 'core', 'extra', 'top']),
			)
		})
	})

	describe('when composition has duplicate constituents', () => {
		it('deduplicates across branches', () => {
			const result = resolveRoleSet('combined', {
				a: ['shared', 'unique-a'],
				b: ['shared', 'unique-b'],
				combined: ['a', 'b'],
			})
			expect(result).toEqual(
				new Set(['combined', 'a', 'shared', 'unique-a', 'b', 'unique-b']),
			)
		})
	})

	describe('when composition has cycles', () => {
		it('throws on direct self-reference', () => {
			expect(() => resolveRoleSet('a', { a: ['a'] })).toThrow(/circular/i)
		})

		it('throws on two-node cycle', () => {
			expect(() => resolveRoleSet('a', { a: ['b'], b: ['a'] })).toThrow(
				/circular/i,
			)
		})

		it('throws on three-node cycle', () => {
			expect(() =>
				resolveRoleSet('a', { a: ['b'], b: ['c'], c: ['a'] }),
			).toThrow(/circular/i)
		})

		it('includes the cycle path in the error message', () => {
			expect(() => resolveRoleSet('a', { a: ['b'], b: ['a'] })).toThrow('a')
		})
	})

	describe('declaration order independence', () => {
		it('produces the same result regardless of map key order', () => {
			const map1 = {
				'startup-cto': ['fullstack', 'leadership'],
				fullstack: ['frontend', 'backend'],
			}
			const map2 = {
				fullstack: ['frontend', 'backend'],
				'startup-cto': ['fullstack', 'leadership'],
			}
			expect(resolveRoleSet('startup-cto', map1)).toEqual(
				resolveRoleSet('startup-cto', map2),
			)
		})
	})
})
