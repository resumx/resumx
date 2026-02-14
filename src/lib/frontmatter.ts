import { readFileSync } from 'node:fs'
import { closest, distance } from 'fastest-levenshtein'
import matter from 'gray-matter'
import * as TOML from 'smol-toml'
import { z } from 'zod'

const FrontmatterSchema = z.object({
	themes: z
		.preprocess(
			val => (typeof val === 'string' ? [val] : val),
			z.array(z.string({ error: "'themes' must contain only strings" }), {
				error: "'themes' must be a string or an array of strings",
			}),
		)
		.optional(),
	output: z.string({ error: "'output' must be a string" }).optional(),
	pages: z
		.number({ error: "'pages' must be a positive integer (>= 1)" })
		.int({ error: "'pages' must be a positive integer (>= 1)" })
		.min(1, { error: "'pages' must be a positive integer (>= 1)" })
		.optional(),
	style: z.preprocess(
		val => (val === null ? undefined : val),
		z
			.record(
				z.string(),
				z.coerce.string({ error: "'style' values must be strings or numbers" }),
				{ error: "'style' must be an object" },
			)
			.optional(),
	),
	validate: z
		.object({
			extends: z.enum(['recommended', 'minimal', 'strict', 'none']).optional(),
			rules: z
				.record(
					z.string(),
					z.enum(['critical', 'warning', 'note', 'bonus', 'off']),
				)
				.optional(),
		})
		.optional(),
})

export type FrontmatterConfig = z.infer<typeof FrontmatterSchema>

export type ParseResult =
	| {
			ok: true
			config: FrontmatterConfig | null
			content: string
			warnings: string[]
	  }
	| { ok: false; error: string }

/**
 * Detect frontmatter type based on opening delimiter
 */
function detectFrontmatterType(input: string): 'yaml' | 'toml' | null {
	const trimmed = input.trimStart()
	if (trimmed.startsWith('---')) {
		return 'yaml'
	}
	if (trimmed.startsWith('+++')) {
		return 'toml'
	}
	return null
}

/** Max edit distance to consider a field name a likely typo */
const MAX_TYPO_DISTANCE = 2

/**
 * Find a likely typo among the data keys.
 * Returns [unknown key, closest known key] if found, null otherwise.
 */
function detectTypo(
	data: Record<string, unknown>,
): [field: string, suggestion: string] | null {
	const knownKeys = Object.keys(FrontmatterSchema.shape)

	for (const key of Object.keys(data)) {
		if (knownKeys.includes(key)) continue

		const match = closest(key, knownKeys)
		if (distance(key, match) <= MAX_TYPO_DISTANCE) {
			return [key, match]
		}
	}

	return null
}

/**
 * Parse frontmatter from a markdown string.
 * Supports YAML (--- delimited) and TOML (+++ delimited).
 */
export function parseFrontmatterFromString(input: string): ParseResult {
	const frontmatterType = detectFrontmatterType(input)

	// No frontmatter detected
	if (frontmatterType === null) {
		return { ok: true, config: null, content: input, warnings: [] }
	}

	// Parse based on frontmatter type
	const result =
		frontmatterType === 'toml' ?
			matter(input, {
				language: 'toml',
				delimiters: '+++',
				engines: {
					toml: {
						parse: (str: string) => TOML.parse(str),
						stringify: () => {
							throw new Error('TOML stringify not supported')
						},
					},
				},
			})
		:	matter(input)

	// Check if there's any frontmatter data
	const data = result.data as Record<string, unknown>

	if (Object.keys(data).length === 0) {
		return { ok: true, config: null, content: input, warnings: [] }
	}

	// Check for typos
	const typo = detectTypo(data)
	if (typo) {
		const [field, suggestion] = typo
		return {
			ok: false,
			error: `Unknown frontmatter field '${field}'. Did you mean '${suggestion}'?`,
		}
	}

	// Validate with Zod
	const parsed = FrontmatterSchema.safeParse(data)
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? 'Invalid frontmatter',
		}
	}

	const warnings = Object.keys(data)
		.filter(k => !Object.keys(FrontmatterSchema.shape).includes(k))
		.map(k => `unknown frontmatter field '${k}' will be ignored`)

	const config = parsed.data

	return {
		ok: true,
		config: Object.keys(config).length > 0 ? config : null,
		content: result.content,
		warnings,
	}
}

/**
 * Parse frontmatter from a markdown file
 * Supports YAML (--- delimited) and TOML (+++ delimited)
 */
export function parseFrontmatter(filePath: string): ParseResult {
	const input = readFileSync(filePath, 'utf-8')
	return parseFrontmatterFromString(input)
}
