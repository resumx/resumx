import { describe, it, expect } from 'vitest'
import {
	validateTemplateVars,
	expandTemplate,
	validateTemplateUniqueness,
} from './index.js'

// =============================================================================
// validateTemplateVars
// =============================================================================

const VALID = ['role', 'lang']

describe('validateTemplateVars', () => {
	it('accepts known variables', () => {
		expect(() => validateTemplateVars('resume-{role}', VALID)).not.toThrow()
		expect(() =>
			validateTemplateVars('{role}/resume-{lang}', VALID),
		).not.toThrow()
	})

	it('accepts strings without variables', () => {
		expect(() => validateTemplateVars('plain-name', VALID)).not.toThrow()
		expect(() => validateTemplateVars('dir/name', VALID)).not.toThrow()
		expect(() => validateTemplateVars('build/', VALID)).not.toThrow()
	})

	it('throws on unknown variable {name}', () => {
		expect(() => validateTemplateVars('{name}-{role}', VALID)).toThrow(
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
			'Valid variables: {role}, {lang}',
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
	it('expands {role} variable', () => {
		expect(expandTemplate('resume-{role}', { role: 'frontend' })).toBe(
			'resume-frontend',
		)
	})

	it('expands {lang} variable', () => {
		expect(
			expandTemplate('resume-{lang}', { role: 'frontend', lang: 'en' }),
		).toBe('resume-en')
	})

	it('expands both {role} and {lang}', () => {
		expect(
			expandTemplate('John-{role}-{lang}', {
				role: 'frontend',
				lang: 'en',
			}),
		).toBe('John-frontend-en')
	})

	it('expands {role} as directory prefix', () => {
		expect(
			expandTemplate('{role}/John-{lang}', {
				role: 'backend',
				lang: 'en',
			}),
		).toBe('backend/John-en')
	})

	it('replaces missing keys with empty string', () => {
		expect(expandTemplate('resume-{role}', { lang: 'en' })).toBe('resume-')
	})

	it('replaces missing keys in the middle with empty string', () => {
		expect(expandTemplate('resume-{role}-{lang}', { lang: 'en' })).toBe(
			'resume--en',
		)
	})

	it('handles template with static directory prefix', () => {
		expect(
			expandTemplate('build/{role}/John-{lang}', {
				role: 'frontend',
				lang: 'en',
			}),
		).toBe('build/frontend/John-en')
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
			validateTemplateUniqueness('John-{role}', {
				role: ['frontend'],
			}),
		).not.toThrow()
	})

	it('passes with multiple roles and {role} in template', () => {
		expect(() =>
			validateTemplateUniqueness('John-{role}', {
				role: ['frontend', 'backend'],
			}),
		).not.toThrow()
	})

	it('passes with multiple langs and {lang} in template', () => {
		expect(() =>
			validateTemplateUniqueness('John-{lang}', {
				role: ['frontend'],
				lang: ['en', 'fr'],
			}),
		).not.toThrow()
	})

	it('passes with both variables and full matrix', () => {
		expect(() =>
			validateTemplateUniqueness('{role}/John-{lang}', {
				role: ['frontend', 'backend'],
				lang: ['en', 'fr'],
			}),
		).not.toThrow()
	})

	it('throws when multiple roles but no {role}', () => {
		expect(() =>
			validateTemplateUniqueness('John-{lang}', {
				role: ['frontend', 'backend'],
				lang: ['en'],
			}),
		).toThrow('duplicates')
	})

	it('suggests adding {role} when roles collide', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				role: ['frontend', 'backend'],
			}),
		).toThrow('{role}')
	})

	it('throws when multiple langs but no {lang}', () => {
		expect(() =>
			validateTemplateUniqueness('John-{role}', {
				role: ['frontend'],
				lang: ['en', 'fr'],
			}),
		).toThrow('duplicates')
	})

	it('suggests adding {lang} when langs collide', () => {
		expect(() =>
			validateTemplateUniqueness('John-{role}', {
				role: ['frontend'],
				lang: ['en', 'fr'],
			}),
		).toThrow('{lang}')
	})

	it('throws on multi-dimension without both variables', () => {
		expect(() =>
			validateTemplateUniqueness('John-{role}', {
				role: ['frontend', 'backend'],
				lang: ['en', 'fr'],
			}),
		).toThrow('{lang}')
	})

	it('passes when single value in all dimensions', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				role: ['frontend'],
				lang: ['en'],
			}),
		).not.toThrow()
	})

	it('ignores empty dimensions', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				role: ['frontend'],
				lang: [],
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
