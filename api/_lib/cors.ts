import type { VercelRequest, VercelResponse } from '@vercel/node'

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

export function setCorsHeaders(
	req: VercelRequest,
	res: VercelResponse,
	options?: {
		methods?: string
		allowHeaders?: string
		exposeHeaders?: string
	},
): void {
	const origin = req.headers.origin
	if (!origin) return
	const allowed = getAllowedOrigin(Array.isArray(origin) ? origin[0] : origin)
	if (!allowed) return
	res.setHeader('Access-Control-Allow-Origin', allowed)
	res.setHeader(
		'Access-Control-Allow-Methods',
		options?.methods ?? 'GET, OPTIONS',
	)
	if (options?.allowHeaders)
		res.setHeader('Access-Control-Allow-Headers', options.allowHeaders)
	if (options?.exposeHeaders)
		res.setHeader('Access-Control-Expose-Headers', options.exposeHeaders)
}
