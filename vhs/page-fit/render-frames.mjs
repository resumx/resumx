#!/usr/bin/env node

import { chromium } from 'playwright'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync, execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '../..')
const vhsDir = join(__dirname, '..')
const workDir = join(__dirname, '.tmp')
const outputGif = join(vhsDir, 'page-fit-demo.gif')

const VARIANTS = ['sparse', 'medium', 'step3', 'dense']
const DELAY = 120
const VIEWPORT_WIDTH = 1200
const OUTPUT_WIDTH = 1000

async function main() {
	if (!existsSync(workDir)) mkdirSync(workDir, { recursive: true })

	checkDependency('ffmpeg', 'brew install ffmpeg')
	checkDependency('ffprobe', 'brew install ffmpeg')

	for (const variant of VARIANTS) {
		console.log(`Rendering ${variant}...`)
		execFileSync(
			'node',
			[
				join(projectRoot, 'dist/index.js'),
				join(__dirname, `${variant}.md`),
				'--format',
				'png',
				'-o',
				join(workDir, variant),
			],
			{ stdio: 'inherit' },
		)
	}

	// Compute panel height so the code block matches the PDF image's displayed height.
	// The image renders at width:100% of the resume column, so its visible height
	// is determined by the aspect ratio and the column width from the grid layout.
	const densePngPath = join(workDir, 'dense.png')
	const denseDims = execSync(
		`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${densePngPath}"`,
		{ encoding: 'utf-8' },
	).trim()
	const [densePngW, densePngH] = denseDims.split(',').map(Number)

	const bodyPadding = 20
	const gridGap = 20
	const codeFr = 1.15
	const resumeFr = 1
	const resumePanelWidth =
		((VIEWPORT_WIDTH - 2 * bodyPadding - gridGap) * resumeFr) / (codeFr + resumeFr)
	const panelHeightPx = Math.round((resumePanelWidth * densePngH) / densePngW)

	const browser = await chromium.launch({ headless: true })
	const mdContents = VARIANTS.map((v) =>
		readFileSync(join(__dirname, `${v}.md`), 'utf-8'),
	)

	const LINE_HEIGHT = 1.5
	const HEADER_HEIGHT = 31
	const BODY_PADDING = 12
	const denseLineCount = mdContents[mdContents.length - 1].split('\n').length
	const availableHeight = panelHeightPx - HEADER_HEIGHT - BODY_PADDING
	const fontSize = Math.floor((availableHeight / (denseLineCount * LINE_HEIGHT)) * 100) / 100

	for (let i = 0; i < VARIANTS.length; i++) {
		const variant = VARIANTS[i]
		const currentLines = mdContents[i].split('\n')
		const prevLines = i > 0 ? mdContents[i - 1].split('\n') : null
		const newFlags = computeNewLines(currentLines, prevLines)

		const pngData = readFileSync(join(workDir, `${variant}.png`))
		const dataUrl = `data:image/png;base64,${pngData.toString('base64')}`

		const codeHtml = renderCodePanel(currentLines, newFlags)
		const html = buildCompositeHtml(codeHtml, dataUrl, panelHeightPx, fontSize)

		const context = await browser.newContext({
			viewport: { width: VIEWPORT_WIDTH, height: panelHeightPx + 40 },
			deviceScaleFactor: 2,
		})
		const page = await context.newPage()
		await page.setContent(html, { waitUntil: 'load' })
		await page.screenshot({
			path: join(workDir, `frame-${i}.png`),
			fullPage: true,
		})
		await page.close()
		await context.close()

		console.log(`Composited frame ${i + 1}/${VARIANTS.length} (${variant})`)
	}

	await browser.close()

	const framePaths = VARIANTS.map((_, i) => join(workDir, `frame-${i}.png`))
	const frameDurationSec = DELAY / 100

	const concatPath = join(workDir, 'concat.txt')
	const concatContent = framePaths
		.flatMap((p, i) => {
			const lines = [`file '${p}'`, `duration ${frameDurationSec}`]
			if (i === framePaths.length - 1) lines.push(`file '${p}'`)
			return lines
		})
		.join('\n')
	writeFileSync(concatPath, concatContent)

	const palettePath = join(workDir, 'palette.png')
	const scaleFilter = `scale=${OUTPUT_WIDTH}:-1:flags=lanczos`

	execSync(
		`ffmpeg -y -f concat -safe 0 -i "${concatPath}" -vf "${scaleFilter},palettegen=max_colors=256:stats_mode=full" "${palettePath}"`,
		{ stdio: 'inherit' },
	)

	execSync(
		`ffmpeg -y -f concat -safe 0 -i "${concatPath}" -i "${palettePath}" -lavfi "${scaleFilter}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" -loop 0 "${outputGif}"`,
		{ stdio: 'inherit' },
	)

	console.log(`\nCreated ${outputGif}`)
}

// ── Diff ────────────────────────────────────────────────────────────────────

function computeNewLines(currentLines, prevLines) {
	if (!prevLines) return currentLines.map(() => false)

	const freq = new Map()
	for (const line of prevLines) {
		freq.set(line, (freq.get(line) || 0) + 1)
	}

	return currentLines.map((line) => {
		if (line.trim() === '') return false
		const count = freq.get(line) || 0
		if (count > 0) {
			freq.set(line, count - 1)
			return false
		}
		return true
	})
}

// ── Code rendering ──────────────────────────────────────────────────────────

function escapeHtml(s) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

function highlightSyntax(raw) {
	const s = escapeHtml(raw)
	if (s === '---') return `<span class="hl-delim">${s}</span>`
	if (s.startsWith('# '))
		return `<span class="hl-h1">${s}</span>`
	if (s.startsWith('## '))
		return `<span class="hl-h2">${s}</span>`
	if (s.startsWith('### '))
		return `<span class="hl-h3">${s}</span>`
	if (s.startsWith('- '))
		return `<span class="hl-dash">-</span> ${s.slice(2)}`
	if (s.startsWith('_') || s.startsWith('***'))
		return `<span class="hl-meta">${s}</span>`
	if (/^\s*pages:/.test(s))
		return s.replace(
			/^(\s*pages:)(.*)$/,
			'<span class="hl-pages-key">$1</span><span class="hl-pages-val">$2</span>',
		)
	if (/^\s*[a-zA-Z][a-zA-Z &-]*:/.test(s))
		return s.replace(
			/^(\s*[a-zA-Z][a-zA-Z &-]*:)(.*)$/,
			'<span class="hl-key">$1</span><span class="hl-val">$2</span>',
		)
	return s
}

function renderCodePanel(lines, newFlags) {
	return lines
		.map((line, i) => {
			const num = String(i + 1).padStart(3, ' ')
			const bg = newFlags[i] ? ' line-new' : ''
			const content = highlightSyntax(line) || ' '
			return `<div class="code-line${bg}"><span class="ln">${num}</span>${content}</div>`
		})
		.join('\n')
}

// ── HTML template ───────────────────────────────────────────────────────────

function buildCompositeHtml(codeHtml, resumeDataUrl, panelHeightPx, fontSize) {
	return `<!DOCTYPE html>
<html><head><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #161616;
  display: flex;
  justify-content: center;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}
.container {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 20px;
  width: 100%;
}

/* Code panel — fixed height matching the dense resume PNG */
.code-panel {
  height: ${panelHeightPx}px;
  background: #1e1e2e;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
}
.code-header {
  flex-shrink: 0;
  background: #181825;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 7px;
}
.dot { width: 11px; height: 11px; border-radius: 50%; }
.dot-r { background: #f38ba8; }
.dot-y { background: #f9e2af; }
.dot-g { background: #a6e3a1; }
.code-fname {
  color: #6c7086;
  font-size: 12px;
  margin-left: 8px;
}
/* Wrap code-body so it never overflows and text stays top-aligned */
.code-body-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.code-body {
  padding: 6px 0;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: ${fontSize}px;
  line-height: 1.5;
  color: #cdd6f4;
}
.code-line {
  padding: 0 6px;
  white-space: pre;
}
.line-new {
  background: rgba(166, 227, 161, 0.10);
  border-left: 2px solid #a6e3a1;
}
.ln {
  color: #45475a;
  user-select: none;
  display: inline-block;
  width: 16px;
  text-align: right;
  margin-right: 6px;
}

/* Syntax highlighting (Catppuccin Mocha) */
.hl-delim { color: #89b4fa; }
.hl-h1 { color: #89dceb; font-weight: bold; }
.hl-h2 { color: #89dceb; }
.hl-h3 { color: #74c7ec; }
.hl-dash { color: #f9e2af; }
.hl-meta { color: #a6adc8; font-style: italic; }
.hl-pages-key { color: #f38ba8; font-weight: bold; }
.hl-pages-val { color: #a6e3a1; font-weight: bold; }
.hl-key { color: #cba6f7; }
.hl-val { color: #a6e3a1; }

/* Resume panel — same fixed height, image fills it */
.resume-panel {
  height: ${panelHeightPx}px;
  display: flex;
  align-items: flex-start;
}
.resume-img {
  width: 100%;
  display: block;
  border-radius: 6px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
}
</style></head><body>
<div class="container">
  <div class="code-panel">
    <div class="code-header">
      <span class="dot dot-r"></span>
      <span class="dot dot-y"></span>
      <span class="dot dot-g"></span>
      <span class="code-fname">resume.md</span>
    </div>
    <div class="code-body-wrap">
      <div class="code-body">${codeHtml}</div>
    </div>
  </div>
  <div class="resume-panel">
    <img class="resume-img" src="${resumeDataUrl}" />
  </div>
</div>
</body></html>`
}

// ── Utilities ───────────────────────────────────────────────────────────────

function checkDependency(cmd, installHint) {
	try {
		execSync(`which ${cmd}`, { stdio: 'pipe' })
	} catch {
		console.error(`'${cmd}' not found. Install with: ${installHint}`)
		process.exit(1)
	}
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
