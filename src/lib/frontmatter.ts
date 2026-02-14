import { readFileSync } from 'node:fs'
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
})

export type FrontmatterConfig = z.infer<typeof FrontmatterSchema>

export interface ParseResult {
	config: FrontmatterConfig | null
	content: string
	warnings: string[]
}

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

interface ValidationResult {
	config: FrontmatterConfig
	warnings: string[]
}

/**
 * Validate and extract only known fields from parsed frontmatter data
 * Returns warnings for any unknown fields
 */
function validateAndExtract(data: Record<string, unknown>): ValidationResult {
	// Get known fields from the schema
	const knownKeys = new Set(Object.keys(FrontmatterSchema.shape))

	// Collect warnings for unknown fields
	const warnings: string[] = Object.keys(data)
		.filter(k => !knownKeys.has(k))
		.map(k => `unknown frontmatter field '${k}' will be ignored`)

	// Validate with Zod schema (throws on invalid values)
	const config = FrontmatterSchema.parse(data)

	return { config, warnings }
}

/**
 * Check if the config has any meaningful values
 */
function hasConfig(config: FrontmatterConfig): boolean {
	return Object.keys(config).length > 0
}

/**
 * Parse frontmatter from a markdown string
 * Supports YAML (--- delimited) and TOML (+++ delimited)
 */
export function parseFrontmatterFromString(input: string): ParseResult {
	const frontmatterType = detectFrontmatterType(input)

	// No frontmatter detected
	if (frontmatterType === null) {
		return {
			config: null,
			content: input,
			warnings: [],
		}
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
		return {
			config: null,
			content: input,
			warnings: [],
		}
	}

	// Validate and extract config
	const { config, warnings } = validateAndExtract(data)

	return {
		config: hasConfig(config) ? config : null,
		content: result.content,
		warnings,
	}
}

/**
 * Parse frontmatter from a markdown file
 * Supports YAML (--- delimited) and TOML (+++ delimited)
 */
export function parseFrontmatter(filePath: string): ParseResult {
	const content = readFileSync(filePath, 'utf-8')
	return parseFrontmatterFromString(content)
}
