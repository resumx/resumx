import { describe, it, expect } from 'vitest'
import {
	validateTemplateVars,
	expandTemplate,
	validateTemplateUniqueness,
} from './template.js'

// =============================================================================
// validateTemplateVars
// =============================================================================

const VALID = ['theme', 'role']

describe('validateTemplateVars', () => {
	it('accepts known variables', () => {
		expect(() => validateTemplateVars('resume-{theme}', VALID)).not.toThrow()
		expect(() =>
			validateTemplateVars('{role}/resume-{theme}', VALID),
		).not.toThrow()
	})

	it('accepts strings without variables', () => {
		expect(() => validateTemplateVars('plain-name', VALID)).not.toThrow()
		expect(() => validateTemplateVars('dir/name', VALID)).not.toThrow()
		expect(() => validateTemplateVars('build/', VALID)).not.toThrow()
	})

	it('throws on unknown variable {name}', () => {
		expect(() => validateTemplateVars('{name}-{theme}', VALID)).toThrow(
			'Unknown template variable(s): {name}',
		)
	})

	it('throws on unknown variable {format}', () => {
		expect(() => validateTemplateVars('resume-{format}', VALID)).toThrow(
			'Unknown template variable(s): {format}',
		)
	})

	it('lists all unknown variables', () => {
		expect(() => validateTemplateVars('{foo}-{bar}', VALID)).toThrow(
			'Unknown template variable(s): {foo}, {bar}',
		)
	})

	it('mentions valid variables in error', () => {
		expect(() => validateTemplateVars('{foo}', VALID)).toThrow(
			'Valid variables: {theme}, {role}',
		)
	})

	it('uses custom valid vars in error message', () => {
		expect(() => validateTemplateVars('{foo}', ['lang', 'region'])).toThrow(
			'Valid variables: {lang}, {region}',
		)
	})
})

// =============================================================================
// expandTemplate
// =============================================================================

describe('expandTemplate', () => {
	it('expands {theme} variable', () => {
		expect(expandTemplate('resume-{theme}', { theme: 'zurich' })).toBe(
			'resume-zurich',
		)
	})

	it('expands {role} variable', () => {
		expect(
			expandTemplate('resume-{role}', { theme: 'zurich', role: 'frontend' }),
		).toBe('resume-frontend')
	})

	it('expands both {theme} and {role}', () => {
		expect(
			expandTemplate('John-{theme}-{role}', {
				theme: 'zurich',
				role: 'frontend',
			}),
		).toBe('John-zurich-frontend')
	})

	it('expands {role} as directory prefix', () => {
		expect(
			expandTemplate('{role}/John-{theme}', {
				theme: 'oxford',
				role: 'backend',
			}),
		).toBe('backend/John-oxford')
	})

	it('replaces missing keys with empty string', () => {
		expect(expandTemplate('resume-{role}', { theme: 'zurich' })).toBe('resume-')
	})

	it('replaces missing keys in the middle with empty string', () => {
		expect(expandTemplate('resume-{role}-{theme}', { theme: 'zurich' })).toBe(
			'resume--zurich',
		)
	})

	it('handles template with static directory prefix', () => {
		expect(
			expandTemplate('build/{role}/John-{theme}', {
				theme: 'modern',
				role: 'frontend',
			}),
		).toBe('build/frontend/John-modern')
	})

	it('works with arbitrary variable names', () => {
		expect(
			expandTemplate('hello-{lang}-{region}', {
				lang: 'en',
				region: 'us',
			}),
		).toBe('hello-en-us')
	})
})

// =============================================================================
// validateTemplateUniqueness
// =============================================================================

describe('validateTemplateUniqueness', () => {
	it('passes with single value per dimension', () => {
		expect(() =>
			validateTemplateUniqueness('John-{theme}', {
				theme: ['zurich'],
			}),
		).not.toThrow()
	})

	it('passes with multiple themes and {theme} in template', () => {
		expect(() =>
			validateTemplateUniqueness('John-{theme}', {
				theme: ['zurich', 'oxford'],
			}),
		).not.toThrow()
	})

	it('passes with multiple roles and {role} in template', () => {
		expect(() =>
			validateTemplateUniqueness('John-{role}', {
				theme: ['zurich'],
				role: ['frontend', 'backend'],
			}),
		).not.toThrow()
	})

	it('passes with both variables and full matrix', () => {
		expect(() =>
			validateTemplateUniqueness('{role}/John-{theme}', {
				theme: ['zurich', 'oxford'],
				role: ['frontend', 'backend'],
			}),
		).not.toThrow()
	})

	it('throws when multiple themes but no {theme}', () => {
		expect(() =>
			validateTemplateUniqueness('John-{role}', {
				theme: ['zurich', 'oxford'],
			}),
		).toThrow('duplicates')
	})

	it('suggests adding {theme} when themes collide', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				theme: ['zurich', 'oxford'],
			}),
		).toThrow('{theme}')
	})

	it('throws when multiple roles but no {role}', () => {
		expect(() =>
			validateTemplateUniqueness('John-{theme}', {
				theme: ['zurich'],
				role: ['frontend', 'backend'],
			}),
		).toThrow('duplicates')
	})

	it('suggests adding {role} when roles collide', () => {
		expect(() =>
			validateTemplateUniqueness('John-{theme}', {
				theme: ['zurich'],
				role: ['frontend', 'backend'],
			}),
		).toThrow('{role}')
	})

	it('throws on multi-dimension without both variables', () => {
		expect(() =>
			validateTemplateUniqueness('John-{theme}', {
				theme: ['zurich', 'oxford'],
				role: ['frontend', 'backend'],
			}),
		).toThrow('{role}')
	})

	it('passes when single value in all dimensions', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				theme: ['zurich'],
				role: ['frontend'],
			}),
		).not.toThrow()
	})

	it('ignores empty dimensions', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				theme: ['zurich'],
				role: [],
			}),
		).not.toThrow()
	})

	it('works with arbitrary dimension names', () => {
		expect(() =>
			validateTemplateUniqueness('doc-{lang}', {
				lang: ['en', 'fr'],
				region: ['us'],
			}),
		).not.toThrow()

		expect(() =>
			validateTemplateUniqueness('doc', {
				lang: ['en', 'fr'],
			}),
		).toThrow('{lang}')
	})
})
