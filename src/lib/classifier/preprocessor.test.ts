import { describe, it, expect } from 'vitest'
import { Preprocessor, DEFAULT_STOP_WORDS } from './preprocessor.js'

// =============================================================================
// Tests: Preprocessor class
// =============================================================================

describe('Preprocessor', () => {
	describe('constructor', () => {
		it('creates with default options', () => {
			const preprocessor = new Preprocessor()
			expect(preprocessor).toBeInstanceOf(Preprocessor)
		})

		it('creates with custom stop words', () => {
			const preprocessor = new Preprocessor({
				stopWords: new Set(['custom', 'words']),
			})
			expect(preprocessor).toBeInstanceOf(Preprocessor)
		})

		it('creates with custom min token length', () => {
			const preprocessor = new Preprocessor({ minTokenLength: 3 })
			expect(preprocessor).toBeInstanceOf(Preprocessor)
		})
	})

	describe('tokenize', () => {
		const preprocessor = new Preprocessor()

		it('splits text into tokens', () => {
			expect(
				preprocessor.tokenize('professional skills and abilities'),
			).toEqual(['professional', 'skills', 'abilities'])
		})

		it('filters out very short tokens', () => {
			expect(preprocessor.tokenize('a b c skills')).toEqual(['skills'])
		})

		it('filters out stop words', () => {
			expect(preprocessor.tokenize('the work of my life')).toEqual([
				'work',
				'life',
			])
		})

		it('handles empty input', () => {
			expect(preprocessor.tokenize('')).toEqual([])
		})

		it('handles whitespace-only input', () => {
			expect(preprocessor.tokenize('   ')).toEqual([])
		})
	})

	describe('tokenize with custom options', () => {
		it('respects custom stop words', () => {
			const preprocessor = new Preprocessor({
				stopWords: new Set(['work', 'life']),
			})
			expect(preprocessor.tokenize('the work of my life')).toEqual([
				'the',
				'of',
				'my',
			])
		})

		it('respects custom min token length', () => {
			const preprocessor = new Preprocessor({ minTokenLength: 4 })
			expect(preprocessor.tokenize('a ab abc abcd abcde')).toEqual([
				'abcd',
				'abcde',
			])
		})
	})

	describe('preprocess', () => {
		const preprocessor = new Preprocessor()

		it('converts text to lowercase', () => {
			expect(preprocessor.preprocess('SKILLS')).toBe('skill')
		})

		it('removes special characters', () => {
			expect(preprocessor.preprocess('work-experience!')).toBe(
				'work experience',
			)
		})

		it('normalizes whitespace', () => {
			expect(preprocessor.preprocess('  professional   summary  ')).toBe(
				'professional summary',
			)
		})

		it('removes trailing s (basic stemming)', () => {
			expect(preprocessor.preprocess('skills')).toBe('skill')
			expect(preprocessor.preprocess('experiences')).toBe('experience')
		})

		it('handles empty input', () => {
			expect(preprocessor.preprocess('')).toBe('')
		})

		it('handles undefined input', () => {
			expect(preprocessor.preprocess(undefined as unknown as string)).toBe('')
		})

		it('filters stop words', () => {
			expect(preprocessor.preprocess('the work of my life')).toBe('work life')
		})
	})
})

// =============================================================================
// Tests: DEFAULT_STOP_WORDS
// =============================================================================

describe('DEFAULT_STOP_WORDS', () => {
	it('contains common English stop words', () => {
		expect(DEFAULT_STOP_WORDS.has('the')).toBe(true)
		expect(DEFAULT_STOP_WORDS.has('and')).toBe(true)
		expect(DEFAULT_STOP_WORDS.has('of')).toBe(true)
		expect(DEFAULT_STOP_WORDS.has('for')).toBe(true)
	})

	it('does not contain content words', () => {
		expect(DEFAULT_STOP_WORDS.has('work')).toBe(false)
		expect(DEFAULT_STOP_WORDS.has('skills')).toBe(false)
		expect(DEFAULT_STOP_WORDS.has('education')).toBe(false)
	})
})
