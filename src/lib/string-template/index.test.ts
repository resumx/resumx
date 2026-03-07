import { describe, it, expect } from 'vitest'
import {
	validateTemplateVars,
	expandTemplate,
	validateTemplateUniqueness,
} from './index.js'

// =============================================================================
// validateTemplateVars
// =============================================================================

const VALID = ['view', 'lang', 'format']

describe('validateTemplateVars', () => {
	it('accepts known variables', () => {
		expect(() => validateTemplateVars('resume-{view}', VALID)).not.toThrow()
		expect(() =>
			validateTemplateVars('{view}/resume-{lang}', VALID),
		).not.toThrow()
	})

	it('accepts strings without variables', () => {
		expect(() => validateTemplateVars('plain-name', VALID)).not.toThrow()
		expect(() => validateTemplateVars('dir/name', VALID)).not.toThrow()
		expect(() => validateTemplateVars('build/', VALID)).not.toThrow()
	})

	it('throws on unknown variable {name}', () => {
		expect(() => validateTemplateVars('{name}-{view}', VALID)).toThrow(
			'Unknown template variable(s): {name}',
		)
	})

	it('accepts known variable {format}', () => {
		expect(() => validateTemplateVars('resume-{format}', VALID)).not.toThrow()
	})

	it('lists all unknown variables', () => {
		expect(() => validateTemplateVars('{foo}-{bar}', VALID)).toThrow(
			'Unknown template variable(s): {foo}, {bar}',
		)
	})

	it('mentions valid variables in error', () => {
		expect(() => validateTemplateVars('{foo}', VALID)).toThrow(
			'Valid variables: {view}, {lang}, {format}',
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
	it('expands {view} variable', () => {
		expect(expandTemplate('resume-{view}', { view: 'frontend' })).toBe(
			'resume-frontend',
		)
	})

	it('expands {lang} variable', () => {
		expect(
			expandTemplate('resume-{lang}', { view: 'frontend', lang: 'en' }),
		).toBe('resume-en')
	})

	it('expands both {view} and {lang}', () => {
		expect(
			expandTemplate('John-{view}-{lang}', {
				view: 'frontend',
				lang: 'en',
			}),
		).toBe('John-frontend-en')
	})

	it('expands {view} as directory prefix', () => {
		expect(
			expandTemplate('{view}/John-{lang}', {
				view: 'backend',
				lang: 'en',
			}),
		).toBe('backend/John-en')
	})

	it('replaces missing keys with empty string', () => {
		expect(expandTemplate('resume-{view}', { lang: 'en' })).toBe('resume-')
	})

	it('replaces missing keys in the middle with empty string', () => {
		expect(expandTemplate('resume-{view}-{lang}', { lang: 'en' })).toBe(
			'resume--en',
		)
	})

	it('handles template with static directory prefix', () => {
		expect(
			expandTemplate('build/{view}/John-{lang}', {
				view: 'frontend',
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
			validateTemplateUniqueness('John-{view}', {
				view: ['frontend'],
			}),
		).not.toThrow()
	})

	it('passes with multiple views and {view} in template', () => {
		expect(() =>
			validateTemplateUniqueness('John-{view}', {
				view: ['frontend', 'backend'],
			}),
		).not.toThrow()
	})

	it('passes with multiple langs and {lang} in template', () => {
		expect(() =>
			validateTemplateUniqueness('John-{lang}', {
				view: ['frontend'],
				lang: ['en', 'fr'],
			}),
		).not.toThrow()
	})

	it('passes with both variables and full matrix', () => {
		expect(() =>
			validateTemplateUniqueness('{view}/John-{lang}', {
				view: ['frontend', 'backend'],
				lang: ['en', 'fr'],
			}),
		).not.toThrow()
	})

	it('throws when multiple views but no {view}', () => {
		expect(() =>
			validateTemplateUniqueness('John-{lang}', {
				view: ['frontend', 'backend'],
				lang: ['en'],
			}),
		).toThrow('duplicates')
	})

	it('suggests adding {view} when views collide', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				view: ['frontend', 'backend'],
			}),
		).toThrow('{view}')
	})

	it('throws when multiple langs but no {lang}', () => {
		expect(() =>
			validateTemplateUniqueness('John-{view}', {
				view: ['frontend'],
				lang: ['en', 'fr'],
			}),
		).toThrow('duplicates')
	})

	it('suggests adding {lang} when langs collide', () => {
		expect(() =>
			validateTemplateUniqueness('John-{view}', {
				view: ['frontend'],
				lang: ['en', 'fr'],
			}),
		).toThrow('{lang}')
	})

	it('throws on multi-dimension without both variables', () => {
		expect(() =>
			validateTemplateUniqueness('John-{view}', {
				view: ['frontend', 'backend'],
				lang: ['en', 'fr'],
			}),
		).toThrow('{lang}')
	})

	it('passes when single value in all dimensions', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				view: ['frontend'],
				lang: ['en'],
			}),
		).not.toThrow()
	})

	it('ignores empty dimensions', () => {
		expect(() =>
			validateTemplateUniqueness('John', {
				view: ['frontend'],
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
