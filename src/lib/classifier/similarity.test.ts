import { describe, it, expect } from 'vitest'
import { distance2, similarity, batchSimilarity } from './similarity.js'
import { Preprocessor } from './preprocessor.js'

// =============================================================================
// Tests: distance2
// =============================================================================

describe('distance2', () => {
	it('returns zero for identical strings', () => {
		expect(distance2('skills', 'skills')).toBe(0)
	})

	it('returns zero for prefix matches', () => {
		expect(distance2('skill', 'skills')).toBe(0)
		expect(distance2('education', 'educations')).toBe(0)
		expect(distance2('edu', 'education')).toBe(0)
		expect(distance2('exp', 'experience')).toBe(0)
	})

	it('handles empty strings', () => {
		expect(distance2('', '')).toBe(0)
		expect(distance2('skills', '')).toBe(6)
		expect(distance2('', 'skills')).toBe(6)
	})

	it('calculates proper distance for different strings', () => {
		expect(distance2('work', 'walk')).toBeGreaterThan(0)
	})
})

// =============================================================================
// Tests: similarity
// =============================================================================

describe('similarity', () => {
	it('returns 1 for identical strings', () => {
		expect(similarity('skills', 'skills')).toBe(1)
	})

	it('returns 1 for prefix matches', () => {
		expect(similarity('edu', 'education')).toBe(1)
		expect(similarity('exp', 'experience')).toBe(1)
	})

	it('returns 0 for completely different strings of same length', () => {
		// "abc" vs "xyz" have distance 3, max length 3, so similarity = 0
		expect(similarity('abc', 'xyz')).toBe(0)
	})
})

// =============================================================================
// Tests: batchSimilarity
// =============================================================================

describe('batchSimilarity', () => {
	const preprocessor = new Preprocessor()

	const workExamples = [
		'work',
		'experience',
		'employment',
		'career',
		'job',
		'role',
		'position',
	]
	const educationExamples = [
		'education',
		'academic',
		'school',
		'college',
		'university',
		'degree',
	]
	const skillsExamples = [
		'skill',
		'competency',
		'expertise',
		'ability',
		'capability',
	]

	it('returns 1 for exact matches', () => {
		expect(batchSimilarity('skills', skillsExamples, preprocessor)).toBe(1)
		expect(batchSimilarity('work experience', workExamples, preprocessor)).toBe(
			1,
		)
	})

	it('handles prefix matches with high similarity', () => {
		expect(batchSimilarity('edu', educationExamples, preprocessor)).toBe(1)
		expect(batchSimilarity('exp', workExamples, preprocessor)).toBe(1)
	})

	it('handles empty inputs', () => {
		expect(batchSimilarity('', [''], preprocessor)).toBe(0)
		expect(batchSimilarity('skills', [], preprocessor)).toBe(0)
		expect(batchSimilarity('', ['skills'], preprocessor)).toBe(0)
	})

	it('returns higher score for better matches', () => {
		const workScore = batchSimilarity(
			'work experience',
			workExamples,
			preprocessor,
		)
		const educationScore = batchSimilarity(
			'work experience',
			educationExamples,
			preprocessor,
		)
		expect(workScore).toBeGreaterThan(educationScore)
	})

	it('respects custom preprocessor stop words', () => {
		const customPreprocessor = new Preprocessor({
			stopWords: new Set(['work']), // 'work' is now a stop word
		})
		// With 'work' filtered out, only 'experience' matches
		const score = batchSimilarity(
			'work experience',
			workExamples,
			customPreprocessor,
		)
		expect(score).toBe(1) // 'experience' still matches exactly
	})
})
