/**
 * Generic text classifier using NL similarity matching
 */
import { Preprocessor, type PreprocessorOptions } from './preprocessor.js'
import { batchSimilarity } from './similarity.js'

/**
 * Configuration for the Classifier
 */
export interface ClassifierConfig<T extends string> {
	/** Category examples: maps each category to keywords/examples */
	examples: Record<T, string[]>
	/** Preprocessor options (stop words, min token length) */
	preprocessor?: PreprocessorOptions
}

/**
 * Result of classification with confidence score
 */
export interface ClassificationResult<T extends string> {
	/** The classified category */
	type: T
	/** Confidence score (0 to 1) */
	score: number
}

/**
 * Generic text classifier using NL similarity matching
 *
 * @example
 * ```ts
 * const classifier = new Classifier({
 *   examples: {
 *     work: ['experience', 'employment', 'career'],
 *     education: ['education', 'academic', 'degree'],
 *   },
 *   preprocessor: {
 *     stopWords: new Set(['the', 'and', 'of']),
 *   },
 * })
 *
 * const result = classifier.classify('Work Experience')
 * // result === 'work'
 * ```
 */
export class Classifier<T extends string> {
	private readonly examples: Record<T, string[]>
	private readonly preprocessor: Preprocessor
	private readonly categories: T[]

	constructor(config: ClassifierConfig<T>) {
		this.examples = config.examples
		this.preprocessor = new Preprocessor(config.preprocessor)
		this.categories = Object.keys(config.examples) as T[]
	}

	/**
	 * Classify text into one of the configured categories
	 *
	 * @param text - Text to classify
	 * @returns The best matching category
	 */
	classify(text: string): T {
		return this.classifyWithScore(text).type
	}

	/**
	 * Classify text with confidence score
	 *
	 * @param text - Text to classify
	 * @returns Classification result with type and score
	 */
	classifyWithScore(text: string): ClassificationResult<T> {
		const cleanedText = this.preprocessor.preprocess(text)

		const results = this.categories
			.map(category => ({
				category,
				score: batchSimilarity(
					cleanedText,
					this.examples[category],
					this.preprocessor,
				),
			}))
			.sort((a, b) => b.score - a.score)

		// categories always has entries, so results[0] is always defined
		const top = results[0]!
		return {
			type: top.category,
			score: top.score,
		}
	}

	/**
	 * Get all classification scores for debugging/analysis
	 *
	 * @param text - Text to classify
	 * @returns Array of all categories with their scores, sorted by score descending
	 */
	classifyAll(text: string): ClassificationResult<T>[] {
		const cleanedText = this.preprocessor.preprocess(text)

		return this.categories
			.map(category => ({
				type: category,
				score: batchSimilarity(
					cleanedText,
					this.examples[category],
					this.preprocessor,
				),
			}))
			.sort((a, b) => b.score - a.score)
	}
}
