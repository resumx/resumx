import { describe, it, expect } from 'vitest'
import {
	resolveTagSet,
	getAncestorTags,
	getDescendantTags,
	expandLineage,
	resolveTagSetWithLineage,
} from './target-composition.js'

describe('resolveTagSet', () => {
	describe('when target has no composition', () => {
		it('returns a set containing only the target itself', () => {
			const result = resolveTagSet('frontend', {})
			expect(result).toEqual(new Set(['frontend']))
		})

		it('returns a set containing only the target when map has unrelated entries', () => {
			const result = resolveTagSet('frontend', {
				fullstack: ['backend', 'devops'],
			})
			expect(result).toEqual(new Set(['frontend']))
		})
	})

	describe('when target is a simple composition', () => {
		it('expands to constituents plus itself', () => {
			const result = resolveTagSet('fullstack', {
				fullstack: ['frontend', 'backend'],
			})
			expect(result).toEqual(new Set(['fullstack', 'frontend', 'backend']))
		})

		it('expands single-constituent composition', () => {
			const result = resolveTagSet('senior', {
				senior: ['backend'],
			})
			expect(result).toEqual(new Set(['senior', 'backend']))
		})
	})

	describe('when target has recursive composition', () => {
		it('expands transitively through nested compositions', () => {
			const result = resolveTagSet('startup-cto', {
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
			const result = resolveTagSet('mega', {
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
			const result = resolveTagSet('combined', {
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
			expect(() => resolveTagSet('a', { a: ['a'] })).toThrow(/circular/i)
		})

		it('throws on two-node cycle', () => {
			expect(() => resolveTagSet('a', { a: ['b'], b: ['a'] })).toThrow(
				/circular/i,
			)
		})

		it('throws on three-node cycle', () => {
			expect(() =>
				resolveTagSet('a', { a: ['b'], b: ['c'], c: ['a'] }),
			).toThrow(/circular/i)
		})

		it('includes the cycle path in the error message', () => {
			expect(() => resolveTagSet('a', { a: ['b'], b: ['a'] })).toThrow('a')
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
			expect(resolveTagSet('startup-cto', map1)).toEqual(
				resolveTagSet('startup-cto', map2),
			)
		})
	})
})

describe('getAncestorTags', () => {
	it('returns empty for flat tags', () => {
		expect(getAncestorTags('backend')).toEqual([])
	})

	it('returns parent for two-level tag (closest first)', () => {
		expect(getAncestorTags('backend/node')).toEqual(['backend'])
	})

	it('returns ancestors closest-first for three-level tag', () => {
		expect(getAncestorTags('data/ml/nlp')).toEqual(['data/ml', 'data'])
	})

	it('handles four-level depth', () => {
		expect(getAncestorTags('a/b/c/d')).toEqual(['a/b/c', 'a/b', 'a'])
	})
})

describe('getDescendantTags', () => {
	it('returns empty when no descendants exist', () => {
		expect(getDescendantTags('backend', ['frontend', 'leadership'])).toEqual([])
	})

	it('returns direct children', () => {
		expect(
			getDescendantTags('backend', ['backend/node', 'backend/jvm', 'frontend']),
		).toEqual(['backend/node', 'backend/jvm'])
	})

	it('returns transitive descendants', () => {
		expect(
			getDescendantTags('data', [
				'data/ml',
				'data/ml/nlp',
				'data/ml/cv',
				'data/analytics',
				'frontend',
			]),
		).toEqual(['data/ml', 'data/ml/nlp', 'data/ml/cv', 'data/analytics'])
	})

	it('does not match tags that happen to share a prefix string', () => {
		expect(getDescendantTags('back', ['backend', 'backend/node'])).toEqual([])
	})
})

describe('expandLineage', () => {
	const contentTags = [
		'backend',
		'backend/node',
		'backend/jvm',
		'frontend',
		'frontend/react',
		'data',
		'data/ml',
		'data/ml/nlp',
		'data/ml/cv',
		'leadership',
	]

	it('returns just the tag for flat tags with no descendants', () => {
		expect(expandLineage('leadership', contentTags)).toEqual(
			new Set(['leadership']),
		)
	})

	it('returns self + descendants for a parent tag', () => {
		expect(expandLineage('backend', contentTags)).toEqual(
			new Set(['backend', 'backend/node', 'backend/jvm']),
		)
	})

	it('returns self + ancestor for a child tag', () => {
		expect(expandLineage('backend/node', contentTags)).toEqual(
			new Set(['backend/node', 'backend']),
		)
	})

	it('returns full lineage for mid-level tag', () => {
		expect(expandLineage('data/ml', contentTags)).toEqual(
			new Set(['data/ml', 'data', 'data/ml/nlp', 'data/ml/cv']),
		)
	})

	it('returns self + all ancestors for leaf tag', () => {
		expect(expandLineage('data/ml/nlp', contentTags)).toEqual(
			new Set(['data/ml/nlp', 'data/ml', 'data']),
		)
	})
})

describe('resolveTagSetWithLineage', () => {
	const contentTags = [
		'backend',
		'backend/node',
		'backend/jvm',
		'frontend',
		'frontend/react',
		'leadership',
	]

	it('expands lineage for a flat tag with descendants', () => {
		const result = resolveTagSetWithLineage('backend', {}, contentTags)
		expect(result).toEqual(new Set(['backend', 'backend/node', 'backend/jvm']))
	})

	it('expands lineage for a child tag (includes ancestor)', () => {
		const result = resolveTagSetWithLineage('backend/node', {}, contentTags)
		expect(result).toEqual(new Set(['backend/node', 'backend']))
	})

	it('expands composition then lineage per original tag (no cascading)', () => {
		const result = resolveTagSetWithLineage(
			'stripe',
			{ stripe: ['frontend/react', 'backend/node'] },
			contentTags,
		)
		expect(result).toEqual(
			new Set([
				'stripe',
				'frontend/react',
				'frontend',
				'backend/node',
				'backend',
			]),
		)
		expect(result.has('frontend/react')).toBe(true)
		expect(result.has('backend/jvm')).toBe(false)
	})

	it('does not cascade: ancestor added from child does not pull in sibling descendants', () => {
		const result = resolveTagSetWithLineage(
			'stripe',
			{ stripe: ['frontend/react', 'backend/node'] },
			contentTags,
		)
		expect(result.has('backend/jvm')).toBe(false)
	})

	it('composition referencing a parent expands descendants', () => {
		const result = resolveTagSetWithLineage(
			'everything-backend',
			{ 'everything-backend': ['backend'] },
			contentTags,
		)
		expect(result).toEqual(
			new Set(['everything-backend', 'backend', 'backend/node', 'backend/jvm']),
		)
	})

	it('flat tags with no hierarchy are unchanged', () => {
		const result = resolveTagSetWithLineage('leadership', {}, contentTags)
		expect(result).toEqual(new Set(['leadership']))
	})

	it('handles orphan hierarchy (child exists but no content tagged with parent)', () => {
		const orphanContent = ['backend/node', 'backend/jvm']
		const result = resolveTagSetWithLineage('backend/node', {}, orphanContent)
		expect(result).toEqual(new Set(['backend/node', 'backend']))
	})
})
