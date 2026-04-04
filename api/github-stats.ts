import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCorsHeaders } from './_lib/cors.js'

const REPO = 'resumx/resumx'
const MEMORY_TTL_MS = 70_000
const EDGE_CACHE = 'public, s-maxage=70, stale-while-revalidate=86400'

interface Stats {
	stargazersCount: number | null
	latestTag: string | null
}

let cache: { data: Stats; expiresAt: number } | null = null

function githubHeaders(): Record<string, string> {
	const h: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		'User-Agent': 'resumx-docs',
	}
	const token = process.env['GITHUB_TOKEN']
	if (token) h['Authorization'] = `Bearer ${token}`
	return h
}

async function fetchStats(): Promise<Stats> {
	const headers = githubHeaders()
	try {
		const [repo, release] = await Promise.all([
			fetch(`https://api.github.com/repos/${REPO}`, { headers }),
			fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
				headers,
			}),
		])

		const repoJson =
			repo.ok ? ((await repo.json()) as { stargazers_count?: number }) : null
		const releaseJson =
			release.ok ? ((await release.json()) as { tag_name?: string }) : null

		return {
			stargazersCount: repoJson?.stargazers_count ?? null,
			latestTag: releaseJson?.tag_name ?? null,
		}
	} catch {
		return { stargazersCount: null, latestTag: null }
	}
}

export default async function handler(
	req: VercelRequest,
	res: VercelResponse,
): Promise<void> {
	setCorsHeaders(req, res)

	if (req.method === 'OPTIONS') return void res.status(204).end()
	if (req.method !== 'GET')
		return void res.status(405).json({ error: 'Method not allowed' })

	const now = Date.now()
	if (!cache || cache.expiresAt <= now) {
		cache = { data: await fetchStats(), expiresAt: now + MEMORY_TTL_MS }
	}

	res.setHeader('Cache-Control', EDGE_CACHE)
	res.status(200).json(cache.data)
}
