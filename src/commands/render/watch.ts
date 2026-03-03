import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import chalk from 'chalk'
import chokidar from 'chokidar'
import {
	parseFrontmatterFromString,
	type FrontmatterConfig,
	type ParseResult,
} from '../../core/frontmatter.js'
import { discoverViewFiles, loadViewFile } from '../../core/view/load.js'
import type { ViewLayer } from '../../core/view/types.js'
import type { RenderScope } from '../../core/view/affected-views.js'
import { runRender, handleCheck } from './run-render.js'
import type {
	WatchHandle,
	RenderCommandOptions,
	RenderContext,
} from './types.js'

export interface WatchInit {
	inputPath: string
	cwd: string
	options: RenderCommandOptions
	context: RenderContext
	parsed: Extract<ParseResult, { ok: true }>
	skipCheck: boolean
	userCssPaths: string[]
}

function diffTags(
	oldTags: FrontmatterConfig['tags'],
	newTags: FrontmatterConfig['tags'],
): string[] {
	const allNames = new Set([
		...Object.keys(oldTags ?? {}),
		...Object.keys(newTags ?? {}),
	])
	const changed: string[] = []
	for (const name of allNames) {
		if (JSON.stringify(oldTags?.[name]) !== JSON.stringify(newTags?.[name])) {
			changed.push(name)
		}
	}
	return changed
}

function globalConfigChanged(
	oldConfig: FrontmatterConfig | null | undefined,
	newConfig: FrontmatterConfig | null | undefined,
): boolean {
	const fields = [
		'css',
		'output',
		'pages',
		'style',
		'icons',
		'validate',
		'vars',
		'sections',
		'bullet-order',
		'extra',
	] as const

	for (const field of fields) {
		const oldVal = oldConfig?.[field]
		const newVal = newConfig?.[field]
		if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) return true
	}
	return false
}

function diffViewFile(
	oldViews: Record<string, ViewLayer>,
	newViews: Record<string, ViewLayer>,
): string[] {
	const allKeys = new Set([...Object.keys(oldViews), ...Object.keys(newViews)])
	const changed: string[] = []
	for (const key of allKeys) {
		if (JSON.stringify(oldViews[key]) !== JSON.stringify(newViews[key])) {
			changed.push(key)
		}
	}
	return changed
}

function computeMarkdownChangeScope(
	prevContent: string,
	prevConfig: FrontmatterConfig | null | undefined,
	newContent: string,
	newConfig: FrontmatterConfig | null | undefined,
): RenderScope {
	if (prevContent !== newContent) return { type: 'full' }

	if (globalConfigChanged(prevConfig, newConfig)) return { type: 'full' }

	const changedTags = diffTags(prevConfig?.tags, newConfig?.tags)
	if (changedTags.length > 0) {
		return { type: 'changedTags', names: changedTags }
	}

	return { type: 'skip' }
}

export async function startWatch(init: WatchInit): Promise<WatchHandle> {
	const { inputPath, cwd, options, context, parsed, skipCheck, userCssPaths } =
		init
	const mdDir = context.cssBaseDir

	let debounceTimer: ReturnType<typeof setTimeout> | null = null
	let prevContent = parsed.content
	let prevConfig = parsed.config

	const viewFiles = discoverViewFiles(mdDir)
	const prevViewFiles = new Map<string, Record<string, ViewLayer>>()
	for (const vf of viewFiles) {
		try {
			prevViewFiles.set(vf, loadViewFile(vf))
		} catch {
			// will handle on change
		}
	}

	const viewGlob = join(mdDir, '*.view.yaml')
	const watchPaths = [inputPath, ...userCssPaths, viewGlob]

	const watcher = chokidar.watch(watchPaths, {
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 100,
			pollInterval: 50,
		},
	})

	await new Promise<void>((watchResolve, reject) => {
		watcher.on('ready', () => {
			console.log(chalk.blue(`\nWatching for changes...`))
			console.log('')
			watchResolve()
		})
		watcher.on('error', reject)
	})

	type ScopeFn = (
		freshParsed: Extract<ParseResult, { ok: true }>,
	) => RenderScope

	function scheduleRender(getScope: ScopeFn) {
		if (debounceTimer) clearTimeout(debounceTimer)

		debounceTimer = setTimeout(async () => {
			try {
				const freshContent = readFileSync(inputPath, 'utf-8')
				const freshParsed = parseFrontmatterFromString(freshContent)
				if (!freshParsed.ok) {
					throw new Error(freshParsed.error)
				}

				const renderScope = getScope(freshParsed)

				prevContent = freshParsed.content
				prevConfig = freshParsed.config

				if (renderScope.type === 'skip') return

				console.log(chalk.blue('\nChange detected, rebuilding...'))

				if (!skipCheck) {
					const proceed = await handleCheck(
						freshContent,
						context.label,
						options,
						freshParsed.config?.validate,
					)
					if (!proceed) return
				}

				await runRender(freshParsed, options, cwd, context, renderScope)
			} catch (error) {
				console.log(chalk.yellow((error as Error).message ?? 'Unknown error'))
				console.log(chalk.yellow('Fix issues and save again.'))
			}
		}, 150)
	}

	watcher.on('change', (changedPath: string) => {
		scheduleRender(freshParsed => {
			if (changedPath.endsWith('.view.yaml')) {
				try {
					const newViews = loadViewFile(changedPath)
					const oldViews = prevViewFiles.get(changedPath) ?? {}
					const changed = diffViewFile(oldViews, newViews)
					prevViewFiles.set(changedPath, newViews)
					return changed.length > 0 ?
							{ type: 'views', names: new Set(changed) }
						:	{ type: 'skip' }
				} catch {
					return { type: 'full' }
				}
			} else if (resolve(changedPath) === inputPath) {
				return computeMarkdownChangeScope(
					prevContent,
					prevConfig,
					freshParsed.content,
					freshParsed.config,
				)
			}
			return { type: 'full' }
		})
	})

	watcher.on('add', (addedPath: string) => {
		if (!addedPath.endsWith('.view.yaml')) return
		watcher.add(addedPath)

		let newViews: Record<string, ViewLayer>
		try {
			newViews = loadViewFile(addedPath)
		} catch {
			return
		}
		prevViewFiles.set(addedPath, newViews)

		const viewNames = Object.keys(newViews)
		if (viewNames.length === 0) return

		scheduleRender(() => ({ type: 'views', names: new Set(viewNames) }))
	})

	let resolveDone: () => void
	const done = new Promise<void>(r => {
		resolveDone = r
	})

	const close = async () => {
		if (debounceTimer) clearTimeout(debounceTimer)
		await watcher.close()
		resolveDone()
	}

	return { close, done }
}
