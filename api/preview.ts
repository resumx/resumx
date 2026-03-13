import type { VercelRequest, VercelResponse } from '@vercel/node'
import { chromium as playwrightCore, type Browser } from 'playwright-core'
import {
	parseFrontmatterFromString,
	extractTagMap,
} from '../src/core/frontmatter.js'
import { resolveView } from '../src/core/view/resolve.js'
import { generateHtml } from '../src/core/html-generator.js'
import { fitToPagesOnPage } from '../src/core/page-fit/index.js'
import { A4_WIDTH_PX } from '../src/core/page-fit/types.js'
import type { FitResult } from '../src/core/page-fit/index.js'
import type { DocumentContext } from '../src/core/types.js'
import type { ViewLayer } from '../src/core/view/types.js'

const MAX_MARKDOWN_LENGTH = 50_000

async function launchBrowser(): Promise<Browser> {
	if (process.env['VERCEL']) {
		const chromium = await import('@sparticuz/chromium')
		return playwrightCore.launch({
			args: chromium.default.args,
			executablePath: await chromium.default.executablePath(),
			headless: true,
		})
	}
	return playwrightCore.launch({ headless: true })
}

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
		res.setHeader(
			'Access-Control-Expose-Headers',
			'X-Resumx-Warnings, X-Resumx-Page-Fit',
		)
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
			if (parsed.config.pages) layer.pages = parsed.config.pages

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
		}

		const view = resolveView([layer])
		view.format = 'html'

		const doc: DocumentContext = {
			content: parsed.content,
			icons: parsed.config?.icons,
			tagMap: extractTagMap(parsed.config?.tags),
			baseDir: process.cwd(),
		}

		const needsPageFit = view.pages !== null
		const html = await generateHtml(doc, view, { tailwind: 'cdn' })

		let finalHtml = html
		let pageFit: Pick<FitResult, 'originalPages' | 'finalPages'> | undefined

		const browser = await launchBrowser()
		try {
			const page = await browser.newPage()
			try {
				await page.setViewportSize({ width: A4_WIDTH_PX, height: 1123 })
				await page.setContent(html, { waitUntil: 'networkidle' })

				if (needsPageFit) {
					try {
						const result = await fitToPagesOnPage(page, html, view.pages!)
						finalHtml = result.html
						pageFit = {
							originalPages: result.originalPages,
							finalPages: result.finalPages,
						}
						await page.setContent(finalHtml, { waitUntil: 'networkidle' })
					} catch (err) {
						console.error('Page fit error:', err)
						warnings.push(
							'Page fitting failed. Showing content without page constraints.',
						)
					}
				}

				const pdfBuffer = await page.pdf({
					preferCSSPageSize: true,
					printBackground: true,
				})
				res.setHeader('Content-Type', 'application/pdf')
				if (warnings.length > 0)
					res.setHeader('X-Resumx-Warnings', JSON.stringify(warnings))
				if (pageFit) res.setHeader('X-Resumx-Page-Fit', JSON.stringify(pageFit))
				res.status(200).send(Buffer.from(pdfBuffer))
			} finally {
				await page.close()
			}
		} finally {
			await browser.close()
		}
	} catch (err) {
		console.error('Preview error:', err)
		const message =
			err instanceof Error ? err.message : 'Preview generation failed'
		res.status(500).json({ error: message })
	}
}
