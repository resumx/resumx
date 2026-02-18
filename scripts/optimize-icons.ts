#!/usr/bin/env npx tsx
/**
 * Optimize SVG icons: SVGO cleanup + Playwright-based viewBox autocrop.
 *
 * Converts internal <style> rules to inline SVG attributes, strips XML
 * declarations, comments, and explicit width/height (keeping viewBox),
 * then uses a real Chromium browser to compute getBBox() and trim the
 * viewBox to tightly fit visible content.
 *
 * Usage:
 *   npx tsx scripts/optimize-icons.ts <input-dir> [output-dir]
 *
 * If output-dir is omitted, files are written back to input-dir (in-place).
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium, type Page } from 'playwright'
import { optimize, type Config } from 'svgo'

const svgoConfig: Config = {
	plugins: [
		'removeXMLProcInst',
		'removeComments',
		'removeDoctype',
		{ name: 'inlineStyles', params: { onlyMatchedOnce: false } },
		'convertStyleToAttrs',
		'removeStyleElement',
		'removeDimensions',
	],
}

interface BBox {
	x: number
	y: number
	width: number
	height: number
}

function parseSvgoArgs(): { inputDir: string; outputDir: string } {
	const [inputArg, outputArg] = process.argv.slice(2)

	if (!inputArg) {
		console.error(
			'Usage: npx tsx scripts/optimize-icons.ts <input-dir> [output-dir]',
		)
		process.exit(1)
	}

	const inputDir = resolve(inputArg)
	const outputDir = resolve(outputArg ?? inputArg)
	return { inputDir, outputDir }
}

function runSvgo(svg: string): string {
	return optimize(svg, svgoConfig).data
}

async function autocropViewBox(page: Page, svg: string): Promise<string> {
	await page.setContent(
		`<!DOCTYPE html><html><body style="margin:0;padding:0">${svg}</body></html>`,
		{ waitUntil: 'domcontentloaded' },
	)

	const bbox: BBox | null = await page.evaluate(() => {
		const el = document.querySelector('svg')
		if (!el) return null

		const clone = el.cloneNode(true) as SVGSVGElement
		clone.style.position = 'absolute'
		clone.style.visibility = 'hidden'
		document.body.appendChild(clone)

		// Strip non-rendered containers (their children inflate the bbox)
		const nonRendered = [
			'defs',
			'clipPath',
			'mask',
			'symbol',
			'pattern',
			'metadata',
		]
		for (const tag of nonRendered) {
			for (const node of clone.querySelectorAll(tag)) node.remove()
		}

		// Strip invisible leaf elements (frame rects with fill=none stroke=none)
		for (const node of [...clone.querySelectorAll('*')]) {
			if (node.children.length > 0) continue
			const fill = node.getAttribute('fill')
			const stroke = node.getAttribute('stroke')
			if (fill === 'none' && (!stroke || stroke === 'none')) {
				node.remove()
			}
		}

		try {
			const b = clone.getBBox()
			clone.remove()
			if (b.width === 0 && b.height === 0) return null
			return { x: b.x, y: b.y, width: b.width, height: b.height }
		} catch {
			clone.remove()
			return null
		}
	})

	if (!bbox || bbox.width <= 0 || bbox.height <= 0) return svg

	const vb = `${round(bbox.x)} ${round(bbox.y)} ${round(bbox.width)} ${round(bbox.height)}`
	return svg.replace(/viewBox="[^"]*"/, `viewBox="${vb}"`)
}

function round(n: number): string {
	return parseFloat(n.toFixed(3)).toString()
}

async function main() {
	const { inputDir, outputDir } = parseSvgoArgs()

	if (outputDir !== inputDir) {
		mkdirSync(outputDir, { recursive: true })
	}

	const files = readdirSync(inputDir).filter(f => f.endsWith('.svg'))
	if (files.length === 0) {
		console.log(`No SVG files found in ${inputDir}`)
		return
	}

	console.log(`Processing ${files.length} SVGs from ${inputDir}`)

	const browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()

	let svgoChanged = 0
	let cropped = 0

	try {
		for (const file of files) {
			const inputPath = join(inputDir, file)
			const outputPath = join(outputDir, file)
			const original = readFileSync(inputPath, 'utf-8')

			const afterSvgo = runSvgo(original)
			if (afterSvgo !== original) svgoChanged++

			const afterCrop = await autocropViewBox(page, afterSvgo)
			if (afterCrop !== afterSvgo) cropped++

			writeFileSync(outputPath, afterCrop, 'utf-8')
		}
	} finally {
		await browser.close()
	}

	console.log(
		`Done: ${svgoChanged} SVGO-optimized, ${cropped} viewBox-cropped out of ${files.length} icons`,
	)
	if (outputDir !== inputDir) {
		console.log(`Output written to ${outputDir}`)
	}
}

main().catch(err => {
	console.error(err)
	process.exit(1)
})
