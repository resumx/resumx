import { describe, it, expect } from 'vitest'
import { Classifier } from './classifier.js'

// =============================================================================
// Test fixtures
// =============================================================================

type TestCategory = 'fruit' | 'vegetable' | 'meat'

const testExamples: Record<TestCategory, string[]> = {
	fruit: ['apple', 'banana', 'orange', 'grape', 'berry'],
	vegetable: ['carrot', 'broccoli', 'spinach', 'lettuce', 'potato'],
	meat: ['beef', 'chicken', 'pork', 'lamb', 'fish'],
}

const testStopWords = new Set(['the', 'a', 'an', 'and', 'or', 'of'])

// =============================================================================
// Tests: Classifier class
// =============================================================================

describe('Classifier', () => {
	describe('constructor', () => {
		it('creates a classifier with examples', () => {
			const classifier = new Classifier({ examples: testExamples })
			expect(classifier).toBeInstanceOf(Classifier)
		})

		it('creates a classifier with custom stop words', () => {
			const classifier = new Classifier({
				examples: testExamples,
				preprocessor: { stopWords: testStopWords },
			})
			expect(classifier).toBeInstanceOf(Classifier)
		})
	})

	describe('classify', () => {
		const classifier = new Classifier({
			examples: testExamples,
			preprocessor: { stopWords: testStopWords },
		})

		it('classifies exact matches', () => {
			expect(classifier.classify('apple')).toBe('fruit')
			expect(classifier.classify('carrot')).toBe('vegetable')
			expect(classifier.classify('chicken')).toBe('meat')
		})

		it('handles mixed case', () => {
			expect(classifier.classify('APPLE')).toBe('fruit')
			expect(classifier.classify('Apple')).toBe('fruit')
			expect(classifier.classify('ApPlE')).toBe('fruit')
		})

		it('handles prefix matches', () => {
			expect(classifier.classify('app')).toBe('fruit')
			expect(classifier.classify('car')).toBe('vegetable')
			expect(classifier.classify('chick')).toBe('meat')
		})

		it('handles similar words (typos)', () => {
			expect(classifier.classify('appel')).toBe('fruit')
			expect(classifier.classify('carott')).toBe('vegetable')
		})

		it('handles stop words', () => {
			expect(classifier.classify('the apple')).toBe('fruit')
			expect(classifier.classify('a carrot and potato')).toBe('vegetable')
		})

		it('handles empty input', () => {
			const result = classifier.classify('')
			expect(typeof result).toBe('string')
		})

		it('handles special characters', () => {
			expect(classifier.classify('== apple ==')).toBe('fruit')
			expect(classifier.classify('*** carrot ***')).toBe('vegetable')
		})
	})

	describe('classifyWithScore', () => {
		const classifier = new Classifier({ examples: testExamples })

		it('returns type and score', () => {
			const result = classifier.classifyWithScore('apple')
			expect(result).toHaveProperty('type')
			expect(result).toHaveProperty('score')
		})

		it('returns 1.0 score for exact matches', () => {
			const result = classifier.classifyWithScore('apple')
			expect(result.type).toBe('fruit')
			expect(result.score).toBe(1)
		})

		it('returns higher score for better matches', () => {
			const appleResult = classifier.classifyWithScore('apple')
			const appResult = classifier.classifyWithScore('app')
			expect(appleResult.score).toBeGreaterThanOrEqual(appResult.score)
		})
	})

	describe('classifyAll', () => {
		const classifier = new Classifier({ examples: testExamples })

		it('returns all categories with scores', () => {
			const results = classifier.classifyAll('apple')
			expect(results).toHaveLength(3)
			expect(results.every(r => 'type' in r && 'score' in r)).toBe(true)
		})

		it('returns results sorted by score descending', () => {
			const results = classifier.classifyAll('apple')
			for (let i = 1; i < results.length; i++) {
				expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score)
			}
		})

		it('best match is the same as classify result', () => {
			const allResults = classifier.classifyAll('apple')
			const classifyResult = classifier.classify('apple')
			expect(allResults[0]!.type).toBe(classifyResult)
		})
	})

	describe('reusability', () => {
		it('can classify multiple times with same instance', () => {
			const classifier = new Classifier({ examples: testExamples })

			expect(classifier.classify('apple')).toBe('fruit')
			expect(classifier.classify('carrot')).toBe('vegetable')
			expect(classifier.classify('beef')).toBe('meat')
			expect(classifier.classify('orange')).toBe('fruit')
		})

		it('different classifiers with different examples work independently', () => {
			const foodClassifier = new Classifier({ examples: testExamples })

			const colorExamples: Record<'warm' | 'cool', string[]> = {
				warm: ['red', 'orange', 'yellow'],
				cool: ['blue', 'green', 'purple'],
			}
			const colorClassifier = new Classifier({ examples: colorExamples })

			expect(foodClassifier.classify('orange')).toBe('fruit')
			expect(colorClassifier.classify('orange')).toBe('warm')
		})
	})
})
