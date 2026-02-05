/**
 * Generic Text Classifier
 *
 * A reusable NL-based classifier that can be configured with custom
 * stop words and category examples for various classification tasks.
 *
 * @example
 * ```ts
 * import { Classifier } from './classifier'
 *
 * type Category = 'fruit' | 'vegetable'
 *
 * const classifier = new Classifier<Category>({
 *   examples: {
 *     fruit: ['apple', 'banana', 'orange'],
 *     vegetable: ['carrot', 'broccoli', 'spinach'],
 *   },
 *   preprocessor: {
 *     stopWords: new Set(['the', 'a', 'an']),
 *   },
 * })
 *
 * classifier.classify('fresh apple')  // 'fruit'
 * classifier.classify('green broccoli')  // 'vegetable'
 * ```
 */

export { Classifier } from './classifier.js'
export type { ClassifierConfig, ClassificationResult } from './classifier.js'
export { Preprocessor, DEFAULT_STOP_WORDS } from './preprocessor.js'
export type { PreprocessorOptions } from './preprocessor.js'
export { similarity, batchSimilarity, distance2 } from './similarity.js'
