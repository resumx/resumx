import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { z } from 'zod'
import {
	SectionsSchema,
	PagesSchema,
	BulletOrderSchema,
	VarsSchema,
	StyleSchema,
	FormatSchema,
	CssSchema,
} from '../frontmatter.js'
import type { ViewLayer } from './types.js'

const VIEW_FILE_SUFFIX = '.view.yaml'

const CustomViewSchema = z.object({
	selects: z
		.preprocess(
			val => (typeof val === 'string' ? [val] : val),
			z.array(z.string()),
		)
		.optional(),
	sections: SectionsSchema.optional(),
	pages: PagesSchema.optional(),
	'bullet-order': BulletOrderSchema.optional(),
	vars: VarsSchema.optional(),
	style: StyleSchema,
	format: FormatSchema.optional(),
	output: z.string().optional(),
	css: CssSchema.optional(),
})

type CustomViewConfig = z.infer<typeof CustomViewSchema>

function configToViewLayer(config: CustomViewConfig): ViewLayer {
	const layer: ViewLayer = {}
	if (config.selects !== undefined) layer.selects = config.selects
	if (config.sections) layer.sections = config.sections
	if (config.pages !== undefined) layer.pages = config.pages
	if (config['bullet-order']) layer.bulletOrder = config['bullet-order']
	if (config.vars) layer.vars = config.vars
	if (config.style) layer.style = config.style as Record<string, string>
	if (config.format) layer.format = config.format
	if (config.output) layer.output = config.output
	if (config.css) layer.css = config.css
	return layer
}

/**
 * Find all `**\/*.view.yaml` files relative to baseDir.
 * Returns absolute paths sorted alphabetically for deterministic order.
 */
export function discoverViewFiles(baseDir: string): string[] {
	if (!existsSync(baseDir)) return []

	const entries = readdirSync(baseDir, {
		recursive: true,
		encoding: 'utf-8',
	})

	return entries
		.filter(entry => entry.endsWith(VIEW_FILE_SUFFIX))
		.map(entry => join(baseDir, entry))
		.sort()
}

/**
 * Parse a single `.view.yaml` file. Top-level keys are view names,
 * values are view configurations. Returns a map of name → ViewLayer.
 */
export function loadViewFile(filePath: string): Record<string, ViewLayer> {
	const raw = readFileSync(filePath, 'utf-8')
	const relPath = relative(process.cwd(), filePath)

	let parsed: unknown
	try {
		parsed = parseYaml(raw)
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		throw new Error(`Invalid YAML in ${relPath}: ${msg}`)
	}

	if (parsed === null || parsed === undefined) {
		return {}
	}

	if (typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error(
			`Invalid view file ${relPath}: expected a YAML mapping of view names to configurations`,
		)
	}

	const views: Record<string, ViewLayer> = {}

	for (const [name, value] of Object.entries(
		parsed as Record<string, unknown>,
	)) {
		if (value === null || value === undefined) {
			views[name] = {}
			continue
		}

		const result = CustomViewSchema.safeParse(value)
		if (!result.success) {
			const issue = result.error.issues[0]?.message ?? 'Invalid view config'
			throw new Error(`Invalid view '${name}' in ${relPath}: ${issue}`)
		}

		views[name] = configToViewLayer(result.data)
	}

	return views
}

/**
 * Discover all `.view.yaml` files under baseDir and load them.
 * Errors on duplicate view names across files.
 */
export function loadAllViews(baseDir: string): Record<string, ViewLayer> {
	const files = discoverViewFiles(baseDir)
	const allViews: Record<string, ViewLayer> = {}
	const sourceMap = new Map<string, string>()

	for (const file of files) {
		const views = loadViewFile(file)
		const relFile = relative(process.cwd(), file)

		for (const [name, layer] of Object.entries(views)) {
			const existing = sourceMap.get(name)
			if (existing) {
				throw new Error(
					`Duplicate view name '${name}' found in ${relFile} and ${existing}`,
				)
			}
			sourceMap.set(name, relFile)
			allViews[name] = layer
		}
	}

	return allViews
}
