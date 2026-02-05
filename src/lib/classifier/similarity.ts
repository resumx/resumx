/**
 * Text similarity utilities using Levenshtein distance
 */
import { distance } from 'fastest-levenshtein'
import { Preprocessor } from './preprocessor.js'

/**
 * Calculate edit distance between two strings
 * Returns 0 if one string is a prefix of the other
 */
export function distance2(a: string, b: string): number {
	if (a.length === 0) return b.length
	if (b.length === 0) return a.length
	if (a.startsWith(b) || b.startsWith(a)) return 0

	return distance(a, b)
}

/**
 * Calculate similarity score between two strings (0 to 1)
 * 1 = identical, 0 = completely different
 */
export function similarity(a: string, b: string): number {
	return 1 - distance2(a, b) / Math.max(a.length, b.length)
}

/**
 * Calculate best similarity score between text and a list of examples
 * Tokenizes the text and finds max similarity for each token against all examples
 *
 * @param text - Text to compare
 * @param examples - List of example strings to compare against
 * @param preprocessor - Preprocessor instance for tokenization
 */
export function batchSimilarity(
	text: string,
	examples: string[],
	preprocessor: Preprocessor,
): number {
	if (!text || !examples || examples.length === 0) return 0

	const textTokens = preprocessor.tokenize(text.toLowerCase())

	if (textTokens.length === 0) return 0

	const similarityScores = textTokens.map(token =>
		Math.max(...examples.map(example => similarity(token, example))),
	)

	// Scale scores by inverse of token count (more tokens = less weight each)
	const scaledSum = similarityScores.reduce(
		(acc, score) => acc + score / similarityScores.length,
		0,
	)

	return scaledSum
}
