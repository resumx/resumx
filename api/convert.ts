import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders } from './_lib/cors.js'
import { verifyTurnstile } from './_lib/turnstile.js'
import { detectFormat } from './_lib/format.js'
import {
	convertWithAI,
	NotAResumeError,
	type ConversionInput,
} from './_converters/ai.js'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_BASE64_LENGTH = Math.ceil(MAX_FILE_SIZE * 1.37)

async function prepareInput(
	format: string,
	buffer: Buffer,
): Promise<ConversionInput> {
	switch (format) {
		case 'pdf':
			return {
				kind: 'file',
				buffer,
				mimeType: 'application/pdf',
				label: 'PDF',
			}
		case 'docx': {
			const mammoth = await import('mammoth')
			const result = await mammoth.convertToHtml({ buffer })
			return { kind: 'text', text: result.value, label: 'DOCX' }
		}
		case 'latex':
			return {
				kind: 'text',
				text: buffer.toString('utf-8'),
				label: 'LaTeX',
			}
		case 'json-resume':
			return {
				kind: 'text',
				text: buffer.toString('utf-8'),
				label: 'JSON Resume',
			}
		case 'rendercv':
			return {
				kind: 'text',
				text: buffer.toString('utf-8'),
				label: 'RenderCV YAML',
			}
		case 'reactive-resume':
			return {
				kind: 'text',
				text: buffer.toString('utf-8'),
				label: 'Reactive Resume JSON',
			}
		case 'yaml-resume':
			return {
				kind: 'text',
				text: buffer.toString('utf-8'),
				label: 'YAMLResume YAML',
			}
		default:
			throw new Error(`Unsupported format: ${format}`)
	}
}

export default async function handler(
	req: VercelRequest,
	res: VercelResponse,
): Promise<void> {
	setCorsHeaders(req, res, {
		methods: 'POST, OPTIONS',
		allowHeaders: 'Content-Type',
	})

	if (req.method === 'OPTIONS') {
		res.status(204).end()
		return
	}

	if (req.method !== 'POST') {
		res.status(405).json({ error: 'Method not allowed' })
		return
	}

	try {
		const { file, filename, turnstileToken } = req.body as {
			file?: string
			filename?: string
			turnstileToken?: string
		}

		if (!file || !filename) {
			res.status(400).json({ error: 'Missing file or filename' })
			return
		}

		const turnstileRequired =
			!!process.env['TURNSTILE_SECRET_KEY']
			|| process.env['VERCEL_ENV'] === 'production'

		if (turnstileRequired) {
			if (!turnstileToken) {
				res.status(403).json({ error: 'Verification required' })
				return
			}
			const valid = await verifyTurnstile(turnstileToken)
			if (!valid) {
				res.status(403).json({ error: 'Verification failed' })
				return
			}
		}

		if (file.length > MAX_BASE64_LENGTH) {
			res.status(400).json({ error: 'File too large (5MB max)' })
			return
		}

		const buffer = Buffer.from(file, 'base64')

		const format = detectFormat(filename, buffer)
		if (!format) {
			res.status(400).json({
				error:
					'Unsupported format. Accepted: PDF, DOCX, LaTeX (.tex), JSON Resume (.json), RenderCV (.yaml)',
			})
			return
		}

		const input = await prepareInput(format, buffer)
		const markdown = await convertWithAI(input)

		res.status(200).json({ markdown })
	} catch (err) {
		if (err instanceof NotAResumeError) {
			res.status(400).json({ error: err.message })
			return
		}
		console.error('Conversion error:', err)
		res.status(500).json({ error: 'Conversion failed. Please try again.' })
	}
}
