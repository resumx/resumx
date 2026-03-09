#!/usr/bin/env node

/**
 * Renders the 5 step markdown files and outputs:
 *   - step1.png … step5.png   (rendered resume screenshots)
 *   - manifest.json           (code panel HTML per step for the left pane)
 *
 * Usage:  node build-demo.mjs
 * Output: docs/public/demos/page-fit/
 */

import { execFileSync } from 'node:child_process'
import {
	readFileSync,
	writeFileSync,
	existsSync,
	mkdirSync,
	copyFileSync,
	readdirSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '../../../../../../')
const stepsDir = join(__dirname, 'steps')
const outputDir = join(projectRoot, 'docs/public/demos/page-fit')

const STEPS = ['step1', 'step2', 'step3', 'step4', 'step5']
const tmpDir = join(__dirname, '.tmp')

// ── Render each step to PNG ─────────────────────────────────────────────────

function renderStep(step) {
	const mdPath = join(stepsDir, `${step}.md`)
	if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })

	execFileSync(
		'node',
		[
			join(projectRoot, 'dist/index.js'),
			mdPath,
			'--format',
			'png',
			'-o',
			tmpDir + '/',
		],
		{ stdio: 'inherit' },
	)

	const outPath = join(tmpDir, `${step}.png`)
	if (!existsSync(outPath)) {
		const allFiles = readdirSync(tmpDir)
		throw new Error(
			`Expected ${outPath}, found: ${allFiles.join(', ')}`,
		)
	}
	return outPath
}

// ── Syntax highlighting for code panel ──────────────────────────────────────

function escapeHtml(s) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

function highlightLine(raw) {
	const s = escapeHtml(raw)
	if (s === '---') return `<span class="hl-delim">${s}</span>`
	if (s.startsWith('# ')) return `<span class="hl-h1">${s}</span>`
	if (s.startsWith('## ')) return `<span class="hl-h2">${s}</span>`
	if (s.startsWith('### ')) return `<span class="hl-h3">${s}</span>`
	if (s.startsWith('- '))
		return `<span class="hl-dash">-</span> ${s.slice(2)}`
	if (s.startsWith('_') || s.startsWith('***'))
		return `<span class="hl-meta">${s}</span>`
	if (/^\s*pages:/.test(s))
		return s.replace(
			/^(\s*pages:)(.*)$/,
			'<span class="hl-pages-key">$1</span><span class="hl-pages-val">$2</span>',
		)
	if (/^\s*[a-zA-Z][a-zA-Z &'-]*:/.test(s))
		return s.replace(
			/^(\s*[a-zA-Z][a-zA-Z &'-]*:)(.*)$/,
			'<span class="hl-key">$1</span><span class="hl-val">$2</span>',
		)
	return s
}

function buildCodePanel(lines, diffLines, diffType) {
	// diffLines: the other step's lines to compare against
	// diffType: 'added' (curr vs prev) or 'removed' (curr vs next)
	const otherFreq = new Map()
	if (diffLines) {
		for (const line of diffLines) {
			otherFreq.set(line, (otherFreq.get(line) || 0) + 1)
		}
	}

	return lines
		.map((line, i) => {
			let diffClass = ''
			if (diffLines && line.trim() !== '') {
				const count = otherFreq.get(line) || 0
				if (count > 0) {
					otherFreq.set(line, count - 1)
				} else {
					diffClass = diffType === 'added' ? ' line-new' : ' line-del'
				}
			}
			const num = String(i + 1).padStart(3, ' ')
			const content = highlightLine(line) || ' '
			return `<div class="code-line${diffClass}"><span class="ln">${num}</span>${content}</div>`
		})
		.join('\n')
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
	if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })
	if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

	console.log('Rendering steps to PNG...')
	const pngPaths = STEPS.map((step) => {
		console.log(`  ${step}...`)
		return renderStep(step)
	})

	console.log('Copying PNGs to public dir...')
	pngPaths.forEach((srcPath, i) => {
		const destPath = join(outputDir, `${STEPS[i]}.png`)
		copyFileSync(srcPath, destPath)
		console.log(`  ${STEPS[i]}.png`)
	})

	console.log('Building code panels...')
	const mdContents = STEPS.map((step) =>
		readFileSync(join(stepsDir, `${step}.md`), 'utf-8'),
	)

	const steps = mdContents.map((md, i) => {
		const lines = md.split('\n')
		const prevLines = i > 0 ? mdContents[i - 1].split('\n') : null
		const nextLines = i < mdContents.length - 1 ? mdContents[i + 1].split('\n') : null
		return {
			codeHtmlAdded: buildCodePanel(lines, prevLines, 'added'),
			// Backward view: show the NEXT step's lines with extras marked red,
			// so the user sees what's being removed when sliding left.
			codeHtmlRemoved: nextLines
				? buildCodePanel(nextLines, lines, 'removed')
				: buildCodePanel(lines, null, 'removed'),
		}
	})

	const manifest = { steps }
	const outPath = join(outputDir, 'manifest.json')
	writeFileSync(outPath, JSON.stringify(manifest, null, 2))
	console.log(`\nWrote ${outPath}`)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
