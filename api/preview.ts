import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
	parseFrontmatterFromString,
	extractTagMap,
} from '../src/core/frontmatter.js'
import { resolveView } from '../src/core/view/resolve.js'
import { generateHtml } from '../src/core/html-generator.js'
import type { DocumentContext } from '../src/core/types.js'
import type { ViewLayer } from '../src/core/view/types.js'

const MAX_MARKDOWN_LENGTH = 50_000

function getAllowedOrigin(origin: string): string | null {
	try {
		const url = new URL(origin)
		const prodUrl = process.env['VERCEL_PROJECT_PRODUCTION_URL']
		if (prodUrl && url.host === prodUrl) return origin
		const vercelUrl = process.env['VERCEL_URL']
		if (vercelUrl && url.host === vercelUrl) return origin
		if (
			url.hostname === 'localhost'
			&& process.env['VERCEL_ENV'] !== 'production'
		)
			return origin
		return null
	} catch {
		return null
	}
}

function setCorsHeaders(req: VercelRequest, res: VercelResponse): void {
	const origin = req.headers.origin
	if (!origin) return
	const allowed = getAllowedOrigin(Array.isArray(origin) ? origin[0] : origin)
	if (allowed) {
		res.setHeader('Access-Control-Allow-Origin', allowed)
		res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
	}
}

export default async function handler(
	req: VercelRequest,
	res: VercelResponse,
): Promise<void> {
	setCorsHeaders(req, res)

	if (req.method === 'OPTIONS') {
		res.status(204).end()
		return
	}

	if (req.method !== 'POST') {
		res.status(405).json({ error: 'Method not allowed' })
		return
	}

	try {
		const { markdown } = req.body as { markdown?: string }

		if (!markdown || typeof markdown !== 'string') {
			res.status(400).json({ error: 'Missing or invalid markdown field' })
			return
		}

		if (markdown.length > MAX_MARKDOWN_LENGTH) {
			res.status(400).json({ error: 'Content too large (50KB max)' })
			return
		}

		const parsed = parseFrontmatterFromString(markdown)
		if (!parsed.ok) {
			res.status(400).json({ error: parsed.error })
			return
		}

		const warnings: string[] = [...parsed.warnings]

		const layer: ViewLayer = {}
		if (parsed.config) {
			if (parsed.config.sections) layer.sections = parsed.config.sections
			if (parsed.config['bullet-order'])
				layer.bulletOrder = parsed.config['bullet-order']
			if (parsed.config.vars) layer.vars = parsed.config.vars
			if (parsed.config.style) layer.style = parsed.config.style

			if (parsed.config.css) {
				const inline = parsed.config.css.filter(
					entry => !entry.trimEnd().toLowerCase().endsWith('.css'),
				)
				if (inline.length < parsed.config.css.length) {
					warnings.push(
						'Custom CSS files are not supported in the playground. Install the CLI for full CSS support.',
					)
				}
				if (inline.length > 0) layer.css = inline
			}

			if (parsed.config.pages) {
				warnings.push(
					'Page fitting requires the CLI. Preview shows content without page constraints.',
				)
			}
		}

		const view = resolveView([layer])
		view.pages = null
		view.format = 'html'

		const doc: DocumentContext = {
			content: parsed.content,
			icons: parsed.config?.icons,
			tagMap: extractTagMap(parsed.config?.tags),
			baseDir: process.cwd(),
		}

		const html = await generateHtml(doc, view, { tailwind: 'cdn' })

		res.status(200).json({
			html,
			...(warnings.length > 0 ? { warnings } : {}),
		})
	} catch (err) {
		console.error('Preview error:', err)
		const message =
			err instanceof Error ? err.message : 'Preview generation failed'
		res.status(500).json({ error: message })
	}
}
