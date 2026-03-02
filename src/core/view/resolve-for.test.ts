import { describe, it, expect } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
	extractTagViews,
	resolveForFlag,
	resolveForValue,
	validateTagComposition,
} from './resolve-for.js'
import { resolveView } from './resolve.js'
import type { ViewLayer } from './types.js'

describe('extractTagViews', () => {
	it('returns empty object for undefined tags', () => {
		expect(extractTagViews(undefined)).toEqual({})
	})

	it('creates view with selects for shorthand tag', () => {
		const views = extractTagViews({
			fullstack: ['frontend', 'backend'],
		})
		expect(views.fullstack).toEqual({
			selects: ['fullstack', 'frontend', 'backend'],
		})
	})

	it('creates view with selects and config for expanded tag', () => {
		const views = extractTagViews({
			frontend: {
				extends: ['backend'],
				sections: { hide: ['publications'] },
				pages: 1,
			},
		})
		expect(views.frontend).toEqual({
			selects: ['frontend', 'backend'],
			sections: { hide: ['publications'] },
			pages: 1,
		})
	})

	it('creates view with just selects for expanded tag without extends', () => {
		const views = extractTagViews({
			frontend: { pages: 1 },
		})
		expect(views.frontend).toEqual({
			selects: ['frontend'],
			pages: 1,
		})
	})

	it('handles mixed shorthand and expanded', () => {
		const views = extractTagViews({
			fullstack: ['frontend', 'backend'],
			frontend: {
				sections: { pin: ['skills'] },
				pages: 1,
			},
		})

		expect(views.fullstack).toEqual({
			selects: ['fullstack', 'frontend', 'backend'],
		})
		expect(views.frontend).toEqual({
			selects: ['frontend'],
			sections: { pin: ['skills'] },
			pages: 1,
		})
	})

	it('includes all expanded config fields', () => {
		const views = extractTagViews({
			frontend: {
				extends: ['backend'],
				sections: { hide: ['publications'], pin: ['skills'] },
				pages: 1,
				'bullet-order': 'tag',
				vars: { tagline: 'Frontend' },
				style: { 'accent-color': '#2563eb' },
				format: 'html',
				output: './dist/frontend',
				css: ['custom.css'],
			},
		})

		expect(views.frontend).toEqual({
			selects: ['frontend', 'backend'],
			sections: { hide: ['publications'], pin: ['skills'] },
			pages: 1,
			bulletOrder: 'tag',
			vars: { tagline: 'Frontend' },
			style: { 'accent-color': '#2563eb' },
			format: 'html',
			output: './dist/frontend',
			css: ['custom.css'],
		})
	})
})

describe('resolveForFlag', () => {
	it('resolves to tag view when name matches', () => {
		const tagViews = {
			frontend: { selects: ['frontend'], pages: 1 },
		}
		const result = resolveForFlag('frontend', tagViews, {}, ['frontend'])
		expect(result).toEqual({ selects: ['frontend'], pages: 1 })
	})

	it('resolves to custom view when name matches', () => {
		const customViews = {
			'stripe-swe': { selects: ['backend'], pages: 1 },
		}
		const result = resolveForFlag('stripe-swe', {}, customViews, [])
		expect(result).toEqual({ selects: ['backend'], pages: 1 })
	})

	it('creates implicit view for content-only tag', () => {
		const result = resolveForFlag('backend', {}, {}, ['backend', 'frontend'])
		expect(result).toEqual({ selects: ['backend'] })
	})

	it('prefers tag view over implicit view', () => {
		const tagViews = {
			frontend: { selects: ['frontend'], pages: 1 },
		}
		const result = resolveForFlag('frontend', tagViews, {}, ['frontend'])
		expect(result.pages).toBe(1)
	})

	it('throws ambiguity error when name matches both tag and custom view', () => {
		const tagViews = { frontend: { selects: ['frontend'] } }
		const customViews = { frontend: { selects: ['frontend'], pages: 1 } }
		expect(() =>
			resolveForFlag('frontend', tagViews, customViews, ['frontend']),
		).toThrow(/Ambiguous view name 'frontend'/)
	})

	it('throws for unknown name with Levenshtein suggestion', () => {
		const tagViews = { frontend: { selects: ['frontend'] } }
		expect(() => resolveForFlag('fronted', tagViews, {}, ['backend'])).toThrow(
			"Unknown view 'fronted'. Did you mean 'frontend'?",
		)
	})

	it('throws for completely unknown name with available list', () => {
		const tagViews = { frontend: { selects: ['frontend'] } }
		expect(() => resolveForFlag('zzzzz', tagViews, {}, ['backend'])).toThrow(
			'Available: frontend, backend',
		)
	})

	it('throws when no tags or views exist at all', () => {
		expect(() => resolveForFlag('anything', {}, {}, [])).toThrow(
			'No tags or views found',
		)
	})

	it('suggests custom view names in error', () => {
		const customViews = { 'stripe-swe': { selects: ['backend'] } }
		expect(() => resolveForFlag('stripe-sw', {}, customViews, [])).toThrow(
			"Did you mean 'stripe-swe'?",
		)
	})

	it('resolves shorthand-derived tag view', () => {
		const tagViews = {
			fullstack: { selects: ['fullstack', 'frontend', 'backend'] },
		}
		const result = resolveForFlag('fullstack', tagViews, {}, [
			'frontend',
			'backend',
		])
		expect(result.selects).toEqual(['fullstack', 'frontend', 'backend'])
	})
})

describe('resolveForValue', () => {
	describe('exact name resolution', () => {
		it('resolves single tag view', () => {
			const tagViews = { frontend: { selects: ['frontend'], pages: 1 } }
			const result = resolveForValue('frontend', tagViews, {}, ['frontend'])

			expect(result).toHaveLength(1)
			expect(result[0]!.name).toBe('frontend')
			expect(result[0]!.layer.pages).toBe(1)
		})

		it('resolves single custom view', () => {
			const customViews = {
				'stripe-swe': { selects: ['backend'] },
			}
			const result = resolveForValue('stripe-swe', {}, customViews, [])

			expect(result).toHaveLength(1)
			expect(result[0]!.name).toBe('stripe-swe')
		})

		it('resolves content-only tag as implicit view', () => {
			const result = resolveForValue('backend', {}, {}, ['backend'])

			expect(result).toHaveLength(1)
			expect(result[0]!.name).toBe('backend')
			expect(result[0]!.layer).toEqual({ selects: ['backend'] })
		})
	})

	describe('glob pattern resolution', () => {
		it('matches views with wildcard prefix', () => {
			const customViews = {
				'stripe-swe': { selects: ['backend'] },
				'stripe-pm': { selects: ['frontend'] },
				'netflix-fe': { selects: ['frontend'] },
			}
			const result = resolveForValue('stripe-*', {}, customViews, [])

			expect(result).toHaveLength(2)
			expect(result.map(r => r.name).sort()).toEqual([
				'stripe-pm',
				'stripe-swe',
			])
		})

		it('matches all views with *', () => {
			const tagViews = { frontend: { selects: ['frontend'] } }
			const customViews = {
				'stripe-swe': { selects: ['backend'] },
			}
			const result = resolveForValue('*', tagViews, customViews, [])

			expect(result).toHaveLength(2)
		})

		it('includes content-only tags in * glob', () => {
			const tagViews = {
				general: { selects: ['k8s', 'docker', 'scalability'] },
			}
			const result = resolveForValue('*', tagViews, {}, [
				'k8s',
				'docker',
				'scalability',
				'latency',
				'cicd',
			])

			expect(result.map(r => r.name).sort()).toEqual(
				['cicd', 'general', 'k8s', 'docker', 'latency', 'scalability'].sort(),
			)
		})

		it('includes content-only tags in prefix glob', () => {
			const result = resolveForValue('back*', {}, {}, [
				'backend',
				'backend-infra',
				'frontend',
			])

			expect(result).toHaveLength(2)
			expect(result.map(r => r.name).sort()).toEqual([
				'backend',
				'backend-infra',
			])
		})

		it('content-only tags matched by glob get implicit selects', () => {
			const result = resolveForValue('*', {}, {}, ['k8s', 'docker'])

			expect(result).toHaveLength(2)
			expect(result.find(r => r.name === 'k8s')!.layer).toEqual({
				selects: ['k8s'],
			})
			expect(result.find(r => r.name === 'docker')!.layer).toEqual({
				selects: ['docker'],
			})
		})

		it('explicit tag views take precedence over content tags with same name in glob', () => {
			const tagViews = {
				frontend: { selects: ['frontend'], pages: 1 },
			}
			const result = resolveForValue('*', tagViews, {}, ['frontend', 'backend'])

			expect(result).toHaveLength(2)
			const fe = result.find(r => r.name === 'frontend')!
			expect(fe.layer.pages).toBe(1)
			const be = result.find(r => r.name === 'backend')!
			expect(be.layer).toEqual({ selects: ['backend'] })
		})

		it('tag views override custom views with same name in glob', () => {
			const tagViews = { frontend: { selects: ['frontend'], pages: 1 } }
			const customViews = { frontend: { selects: ['frontend'], pages: 2 } }
			const result = resolveForValue('*', tagViews, customViews, [])

			expect(result).toHaveLength(1)
			expect(result[0]!.layer.pages).toBe(1)
		})

		it('throws when no views match a glob', () => {
			const customViews = { 'stripe-swe': { selects: ['backend'] } }
			expect(() =>
				resolveForValue('nonexistent-*', {}, customViews, []),
			).toThrow("No views match pattern 'nonexistent-*'")
		})

		it('throws when glob used with zero views', () => {
			expect(() => resolveForValue('*', {}, {}, [])).toThrow(
				'No views found. Create a .view.yaml file or define tag views in frontmatter.',
			)
		})

		it('matches with ? wildcard', () => {
			const customViews = {
				v1: { pages: 1 },
				v2: { pages: 2 },
				v10: { pages: 10 },
			}
			const result = resolveForValue('v?', {}, customViews, [])

			expect(result).toHaveLength(2)
			expect(result.map(r => r.name).sort()).toEqual(['v1', 'v2'])
		})
	})

	describe('file path resolution', () => {
		function withTempDir<T>(fn: (dir: string) => T): T {
			const dir = mkdtempSync(join(tmpdir(), 'resolve-for-test-'))
			try {
				return fn(dir)
			} finally {
				rmSync(dir, { recursive: true, force: true })
			}
		}

		it('loads views from a file path', () => {
			withTempDir(dir => {
				const file = join(dir, 'adhoc.view.yaml')
				writeFileSync(
					file,
					`adhoc-swe:
  selects: [backend]
  pages: 1
adhoc-pm:
  selects: [frontend]
`,
				)

				const result = resolveForValue(file, {}, {}, [])

				expect(result).toHaveLength(2)
				expect(result.map(r => r.name).sort()).toEqual([
					'adhoc-pm',
					'adhoc-swe',
				])
			})
		})

		it('throws when file has no views', () => {
			withTempDir(dir => {
				const file = join(dir, 'empty.view.yaml')
				writeFileSync(file, '')

				expect(() => resolveForValue(file, {}, {}, [])).toThrow(
					/No views found/,
				)
			})
		})
	})
})

describe('validateTagComposition', () => {
	it('passes when all constituents exist as content tags', () => {
		expect(() =>
			validateTagComposition({ fullstack: ['frontend', 'backend'] }, [
				'frontend',
				'backend',
			]),
		).not.toThrow()
	})

	it('passes when constituent is another composed tag', () => {
		expect(() =>
			validateTagComposition(
				{
					fullstack: ['frontend', 'backend'],
					'startup-cto': ['fullstack', 'leadership'],
				},
				['frontend', 'backend', 'leadership'],
			),
		).not.toThrow()
	})

	it('throws for unknown constituent with Levenshtein suggestion', () => {
		expect(() =>
			validateTagComposition({ fullstack: ['fronted', 'backend'] }, [
				'frontend',
				'backend',
			]),
		).toThrow(
			"Tag 'fronted' in composition 'fullstack' does not exist. Did you mean 'frontend'?",
		)
	})

	it('throws for completely unknown constituent', () => {
		expect(() =>
			validateTagComposition({ fullstack: ['zzzzz', 'backend'] }, [
				'frontend',
				'backend',
			]),
		).toThrow(
			"Tag 'zzzzz' in composition 'fullstack' does not exist in the document or as a composed tag.",
		)
	})

	it('passes for empty composition', () => {
		expect(() =>
			validateTagComposition({ frontend: [] }, ['frontend']),
		).not.toThrow()
	})

	it('accepts implicit parent tag when children exist in content', () => {
		expect(() =>
			validateTagComposition({ fullstack: ['frontend', 'backend'] }, [
				'frontend',
				'backend/node',
				'backend/jvm',
			]),
		).not.toThrow()
	})

	it('accepts hierarchical constituent that exists in content', () => {
		expect(() =>
			validateTagComposition({ stripe: ['frontend', 'backend/node'] }, [
				'frontend',
				'backend/node',
				'backend/jvm',
			]),
		).not.toThrow()
	})
})

describe('resolveForFlag with hierarchical tags', () => {
	it('resolves implicit parent when only children exist as content tags', () => {
		const result = resolveForFlag('backend', {}, {}, [
			'backend/node',
			'backend/jvm',
		])
		expect(result).toEqual({ selects: ['backend'] })
	})

	it('resolves direct content tag as before', () => {
		const result = resolveForFlag('backend/node', {}, {}, [
			'backend/node',
			'backend/jvm',
		])
		expect(result).toEqual({ selects: ['backend/node'] })
	})

	it('throws for name that is not a parent of any content tag', () => {
		expect(() =>
			resolveForFlag('devops', {}, {}, ['backend/node', 'frontend']),
		).toThrow(/Unknown view 'devops'/)
	})
})

describe('end-to-end: 3-layer cascade (default → tag view → ephemeral)', () => {
	it('--for frontend with shorthand tag filters to frontend + constituents', () => {
		const tags = { fullstack: ['frontend', 'backend'] }
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('fullstack', tagViews, {}, [
			'frontend',
			'backend',
		])

		const defaultView: ViewLayer = {
			pages: 2,
			vars: { tagline: 'Full-stack engineer' },
		}
		const ephemeral: ViewLayer = {}

		const resolved = resolveView([defaultView, tagLayer, ephemeral])

		expect(resolved.selects).toEqual(['fullstack', 'frontend', 'backend'])
		expect(resolved.pages).toBe(2)
		expect(resolved.vars).toEqual({ tagline: 'Full-stack engineer' })
	})

	it('--for frontend with expanded tag uses tag view sections, pages, etc.', () => {
		const tags = {
			frontend: {
				sections: {
					hide: ['publications'] as string[],
					pin: ['skills', 'projects'] as string[],
				},
				pages: 1,
			},
		}
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('frontend', tagViews, {}, ['frontend'])

		const defaultView: ViewLayer = {
			pages: 2,
			sections: { hide: [], pin: [] },
		}
		const ephemeral: ViewLayer = {}

		const resolved = resolveView([defaultView, tagLayer, ephemeral])

		expect(resolved.selects).toEqual(['frontend'])
		expect(resolved.pages).toBe(1)
		expect(resolved.sections.hide).toEqual(['publications'])
		expect(resolved.sections.pin).toEqual(['skills', 'projects'])
	})

	it('--for frontend -v tagline="..." ephemeral overrides tag view vars', () => {
		const tags = {
			frontend: {
				vars: { tagline: 'Frontend expert', keywords: 'React, TypeScript' },
				pages: 1,
			},
		}
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('frontend', tagViews, {}, ['frontend'])

		const defaultView: ViewLayer = {
			vars: { tagline: 'Default tagline' },
		}
		const ephemeral: ViewLayer = {
			vars: { tagline: 'CLI override tagline' },
		}

		const resolved = resolveView([defaultView, tagLayer, ephemeral])

		expect(resolved.vars.tagline).toBe('CLI override tagline')
		expect(resolved.vars.keywords).toBe('React, TypeScript')
	})

	it('no --for produces base view with selects: null (no tag filtering)', () => {
		const defaultView: ViewLayer = {
			pages: 1,
			vars: { tagline: 'Full-stack engineer' },
		}
		const ephemeral: ViewLayer = {}

		const resolved = resolveView([defaultView, ephemeral])

		expect(resolved.selects).toBeNull()
		expect(resolved.pages).toBe(1)
		expect(resolved.vars).toEqual({ tagline: 'Full-stack engineer' })
	})

	it('--for content-only tag produces implicit view with selects: [name]', () => {
		const tagViews = extractTagViews(undefined)
		const tagLayer = resolveForFlag('backend', tagViews, {}, [
			'backend',
			'frontend',
		])

		const defaultView: ViewLayer = { pages: 2 }
		const resolved = resolveView([defaultView, tagLayer])

		expect(resolved.selects).toEqual(['backend'])
		expect(resolved.pages).toBe(2)
	})

	it('expanded tag view with all fields propagates through cascade', () => {
		const tags = {
			frontend: {
				extends: ['backend'],
				sections: {
					hide: ['publications'] as string[],
					pin: ['skills'] as string[],
				},
				pages: 1,
				'bullet-order': 'tag' as const,
				vars: { tagline: 'Frontend expert' },
				style: { 'accent-color': '#2563eb' },
				format: 'html' as const,
				output: './dist/frontend',
				css: ['custom.css'],
			},
		}
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('frontend', tagViews, {}, [
			'frontend',
			'backend',
		])

		const defaultView: ViewLayer = {
			pages: 2,
			style: { 'font-family': 'Arial' },
		}

		const resolved = resolveView([defaultView, tagLayer])

		expect(resolved.selects).toEqual(['frontend', 'backend'])
		expect(resolved.pages).toBe(1)
		expect(resolved.bulletOrder).toBe('tag')
		expect(resolved.vars).toEqual({ tagline: 'Frontend expert' })
		expect(resolved.style).toEqual({
			'font-family': 'Arial',
			'accent-color': '#2563eb',
		})
		expect(resolved.format).toBe('html')
		expect(resolved.output).toBe('./dist/frontend')
		expect(resolved.css).toEqual(['custom.css'])
		expect(resolved.sections.hide).toEqual(['publications'])
		expect(resolved.sections.pin).toEqual(['skills'])
	})

	it('ephemeral pages overrides tag view pages in 3-layer stack', () => {
		const tags = { frontend: { pages: 1 } }
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('frontend', tagViews, {}, ['frontend'])

		const defaultView: ViewLayer = { pages: 3 }
		const ephemeral: ViewLayer = { pages: 2 }

		const resolved = resolveView([defaultView, tagLayer, ephemeral])

		expect(resolved.pages).toBe(2)
	})

	it('ephemeral style merges with tag view style (not replaces)', () => {
		const tags = {
			frontend: {
				style: { 'accent-color': '#2563eb', 'font-size': '10pt' },
			},
		}
		const tagViews = extractTagViews(tags)
		const tagLayer = resolveForFlag('frontend', tagViews, {}, ['frontend'])

		const defaultView: ViewLayer = { style: { 'font-family': 'Arial' } }
		const ephemeral: ViewLayer = {
			style: { 'accent-color': '#ef4444' },
		}

		const resolved = resolveView([defaultView, tagLayer, ephemeral])

		expect(resolved.style).toEqual({
			'font-family': 'Arial',
			'accent-color': '#ef4444',
			'font-size': '10pt',
		})
	})
})

describe('end-to-end: custom view cascade (default → custom → ephemeral)', () => {
	it('custom view overrides default view', () => {
		const customView: ViewLayer = {
			selects: ['backend', 'distributed-systems'],
			sections: { hide: ['publications'], pin: ['skills', 'work'] },
			vars: { tagline: 'Stream Processing, Go, Kafka' },
			pages: 1,
		}

		const defaultView: ViewLayer = {
			pages: 2,
			vars: { tagline: 'Full-stack engineer' },
		}

		const resolved = resolveView([defaultView, customView])

		expect(resolved.selects).toEqual(['backend', 'distributed-systems'])
		expect(resolved.pages).toBe(1)
		expect(resolved.vars.tagline).toBe('Stream Processing, Go, Kafka')
	})

	it('ephemeral overrides custom view vars', () => {
		const customView: ViewLayer = {
			selects: ['backend'],
			vars: { tagline: 'Backend engineer', keywords: 'Go, Kafka' },
		}
		const ephemeral: ViewLayer = {
			vars: { tagline: 'CLI override' },
		}

		const resolved = resolveView([{}, customView, ephemeral])

		expect(resolved.vars.tagline).toBe('CLI override')
		expect(resolved.vars.keywords).toBe('Go, Kafka')
	})

	it('custom view with format: html overrides default pdf', () => {
		const customView: ViewLayer = { format: 'html' }

		const resolved = resolveView([{}, customView])

		expect(resolved.format).toBe('html')
	})
})
