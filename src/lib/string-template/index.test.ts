import { describe, it, expect } from 'vitest'
import {
	validateTemplateVars,
	expandTemplate,
	validateTemplateUniqueness,
} from './index.js'

// =============================================================================
// validateTemplateVars
// =============================================================================

const VALID = ['target', 'lang']

describe('validateTemplateVars', () => {
	it('accepts known variables', () => {
		expect(() => validateTemplateVars('resume-{target}', VALID)).not.toThrow()
		expect(() =>
			validateTemplateVars('{target}/resume-{lang}', VALID),
		).not.toThrow()
	})

	it('accepts strings without variables', () => {
		expect(() => validateTemplateVars('plain-name', VALID)).not.toThrow()
		expect(() => validateTemplateVars('dir/name', VALID)).not.toThrow()
		expect(() => validateTemplateVars('build/', VALID)).not.toThrow()
	})

	it('throws on unknown variable {name}', () => {
		expect(() => validateTemplateVars('{name}-{target}', VALID)).toThrow(
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
			'Valid variables: {target}, {lang}',
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
	it('expands {target} variable', () => {
		expect(expandTemplate('resume-{target}', { target: 'frontend' })).toBe(
			'resume-frontend',
		)
	})

	it('expands {lang} variable', () => {
		expect(
			expandTemplate('resume-{lang}', { target: 'frontend', lang: 'en' }),
		).toBe('resume-en')
	})

	it('expands both {target} and {lang}', () => {
		expect(
			expandTemplate('John-{target}-{lang}', {
				target: 'frontend',
				lang: 'en',
			}),
		).toBe('John-frontend-en')
	})

	it('expands {target} as directory prefix', () => {
		expect(
			expandTemplate('{target}/John-{lang}', {
				target: 'backend',
				lang: 'en',
			}),
		).toBe('backend/John-en')
	})

	it('replaces missing keys with empty string', () => {
		expect(expandTemplate('resume-{target}', { lang: 'en' })).toBe('resume-')
	})

	it('replaces missing keys in the middle with empty string', () => {
		expect(expandTemplate('resume-{target}-{lang}', { lang: 'en' })).toBe(
			'resume--en',
		)
	})

	it('handles template with static directory prefix', () => {
		expect(
			expandTemplate('build/{target}/John-{lang}', {
				target: 'frontend',
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
			validateTemplateUniqueness('John-{target}', {
				target: ['frontend'],
			}),
		).not.toThrow()
	})

	it('passes with multiple targets and {target} in template', () => {
		expect(() =>
			validateTemplateUniqueness('John-{target}', {
				target: ['frontend', 'backend'],
			}),
		).not.toThrow()
	})

	it('passes with multiple langs and {lang} in template', () => {
		expect(() =>
			validateTemplateUniqueness('John-{lang}', {
				target: ['frontend'],
				lang: ['en', 'fr'],
			}),
		).not.toThrow()
	})

	it('passes with both variables and full matrix', () => {
		expect(() =>
			validateTemplateUniqueness('{target}/John-{lang}', {
				target: ['frontend', 'backend'],
				lang: ['en', 'fr'],
			}),
		).not.toThrow()
	})

	it('throws when multiple targets but no {target}', () => {
		expect(() =>
			validateTemplateUniqueness('John-{lang}', {
				target: ['frontend', 'backend'],
				lang: ['en'],
			}),
		).toThrow('duplicates')
	})

	it('suggests adding {target} when targets collide', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				target: ['frontend', 'backend'],
			}),
		).toThrow('{target}')
	})

	it('throws when multiple langs but no {lang}', () => {
		expect(() =>
			validateTemplateUniqueness('John-{target}', {
				target: ['frontend'],
				lang: ['en', 'fr'],
			}),
		).toThrow('duplicates')
	})

	it('suggests adding {lang} when langs collide', () => {
		expect(() =>
			validateTemplateUniqueness('John-{target}', {
				target: ['frontend'],
				lang: ['en', 'fr'],
			}),
		).toThrow('{lang}')
	})

	it('throws on multi-dimension without both variables', () => {
		expect(() =>
			validateTemplateUniqueness('John-{target}', {
				target: ['frontend', 'backend'],
				lang: ['en', 'fr'],
			}),
		).toThrow('{lang}')
	})

	it('passes when single value in all dimensions', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				target: ['frontend'],
				lang: ['en'],
			}),
		).not.toThrow()
	})

	it('ignores empty dimensions', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				target: ['frontend'],
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
