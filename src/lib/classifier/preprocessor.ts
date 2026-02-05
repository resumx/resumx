/**
 * Text preprocessing utilities for classification
 */

/**
 * Default stop words for English text
 */
export const DEFAULT_STOP_WORDS = new Set([
	'of',
	'for',
	'my',
	'and',
	'or',
	'&',
	'the',
	'in',
	'to',
	'at',
	'by',
	'with',
	'as',
	'from',
	'up',
	'down',
	'out',
	'over',
	'under',
	'again',
	'further',
	'then',
	'all',
	'any',
	'some',
])

/**
 * Configuration options for text preprocessing
 */
export interface PreprocessorOptions {
	/** Stop words to filter out during tokenization */
	stopWords?: Set<string>
	/** Minimum token length to keep (default: 2) */
	minTokenLength?: number
}

/**
 * Text preprocessor for classification
 *
 * Handles tokenization and text normalization with configurable stop words
 *
 * @example
 * ```ts
 * const preprocessor = new Preprocessor({
 *   stopWords: new Set(['the', 'a', 'an']),
 *   minTokenLength: 2,
 * })
 *
 * preprocessor.tokenize('the quick brown fox')
 * // ['quick', 'brown', 'fox']
 *
 * preprocessor.preprocess('The Quick Brown Fox')
 * // 'quick brown fox'
 * ```
 */
export class Preprocessor {
	private readonly stopWords: Set<string>
	private readonly minTokenLength: number

	constructor(options: PreprocessorOptions = {}) {
		this.stopWords = options.stopWords ?? DEFAULT_STOP_WORDS
		this.minTokenLength = options.minTokenLength ?? 2
	}

	/**
	 * Split text into tokens, filtering short tokens and stop words
	 */
	tokenize(text: string): string[] {
		return text
			.split(/\s+/)
			.filter(token => token.length >= this.minTokenLength)
			.filter(token => !this.stopWords.has(token))
	}

	/**
	 * Preprocess text for similarity matching
	 * - Converts to lowercase
	 * - Removes special characters
	 * - Normalizes whitespace
	 * - Removes trailing 's' (basic stemming)
	 * - Filters stop words
	 */
	preprocess(text: string): string {
		if (!text) return ''

		return this.tokenize(text)
			.map(token =>
				token
					.toLowerCase()
					.replace(/[^\w\s]/g, ' ')
					.replace(/\s+/g, ' ')
					.replace(/s$/g, '')
					.trim(),
			)
			.join(' ')
	}
}
