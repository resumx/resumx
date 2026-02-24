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
	icons: z
		.record(z.string(), z.string({ error: "'icons' values must be strings" }), {
			error:
				"'icons' must be an object mapping slugs to SVG, URL, or base64 strings",
		})
		.optional(),
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
	roles: z
		.record(
			z.string(),
			z.preprocess(
				val => (typeof val === 'string' ? [val] : val),
				z.array(
					z.string({ error: "'roles' values must be arrays of strings" }),
					{ error: "'roles' values must be strings or arrays of strings" },
				),
			),
			{
				error:
					"'roles' must be an object mapping role names to constituent arrays",
			},
		)
		.optional(),
	extra: z.record(z.string(), z.unknown()).optional(),
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

	const knownKeys = Object.keys(FrontmatterSchema.shape)

	for (const key of Object.keys(data)) {
		if (knownKeys.includes(key)) continue

		const match = closest(key, knownKeys)
		if (distance(key, match) <= MAX_TYPO_DISTANCE) {
			return {
				ok: false,
				error: `Unknown frontmatter field '${key}'. Did you mean '${match}'?`,
			}
		}

		return {
			ok: false,
			error: `Unknown frontmatter field '${key}'. Use 'extra' for custom fields.`,
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

	const warnings: string[] = []

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
