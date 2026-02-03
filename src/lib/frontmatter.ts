import { readFileSync } from 'node:fs'
import matter from 'gray-matter'
import * as TOML from 'smol-toml'

// Valid output formats
const VALID_FORMATS = ['pdf', 'html', 'docx'] as const
export type OutputFormat = (typeof VALID_FORMATS)[number]

export interface FrontmatterConfig {
	style?: string
	outputName?: string
	outputDir?: string
	formats?: OutputFormat[]
	variables?: Record<string, string>
	roles?: string[]
}

export interface ParseResult {
	config: FrontmatterConfig | null
	content: string
	warnings: string[]
}

// Known frontmatter fields
const KNOWN_FIELDS = [
	'style',
	'outputName',
	'outputDir',
	'formats',
	'variables',
	'roles',
]

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
	const config: FrontmatterConfig = {}
	const warnings: string[] = []

	// Check for unknown fields
	for (const key of Object.keys(data)) {
		if (!KNOWN_FIELDS.includes(key)) {
			warnings.push(`unknown frontmatter field '${key}' will be ignored`)
		}
	}

	// Validate style
	if (data['style'] !== undefined) {
		if (typeof data['style'] !== 'string') {
			throw new Error("'style' must be a string")
		}
		config.style = data['style']
	}

	// Validate outputName
	if (data['outputName'] !== undefined) {
		if (typeof data['outputName'] !== 'string') {
			throw new Error("'outputName' must be a string")
		}
		config.outputName = data['outputName']
	}

	// Validate outputDir
	if (data['outputDir'] !== undefined) {
		if (typeof data['outputDir'] !== 'string') {
			throw new Error("'outputDir' must be a string")
		}
		config.outputDir = data['outputDir']
	}

	// Validate formats
	if (data['formats'] !== undefined) {
		if (!Array.isArray(data['formats'])) {
			throw new Error("'formats' must be an array")
		}

		for (const format of data['formats'] as unknown[]) {
			if (typeof format !== 'string') {
				throw new Error("'formats' must contain only strings")
			}
			if (!VALID_FORMATS.includes(format as OutputFormat)) {
				throw new Error(
					`invalid format '${format}'. Valid formats: ${VALID_FORMATS.join(', ')}`,
				)
			}
		}

		config.formats = data['formats'] as OutputFormat[]
	}

	// Validate variables
	if (data['variables'] !== undefined) {
		if (typeof data['variables'] !== 'object' || data['variables'] === null) {
			throw new Error("'variables' must be an object")
		}

		const vars = data['variables'] as Record<string, unknown>
		for (const [key, value] of Object.entries(vars)) {
			if (typeof value !== 'string') {
				throw new Error(`variable '${key}' must be a string`)
			}
		}

		config.variables = vars as Record<string, string>
	}

	// Validate roles
	if (data['roles'] !== undefined) {
		// Normalize string to single-element array
		const rolesValue =
			typeof data['roles'] === 'string' ? [data['roles']] : data['roles']

		if (!Array.isArray(rolesValue)) {
			throw new Error("'roles' must be a string or an array of strings")
		}

		for (const role of rolesValue as unknown[]) {
			if (typeof role !== 'string') {
				throw new Error("'roles' must contain only strings")
			}
		}

		config.roles = rolesValue as string[]
	}

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
