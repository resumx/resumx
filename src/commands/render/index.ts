import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { parseFrontmatterFromString } from '../../core/frontmatter.js'
import { getOutputName, extractNameFromContent } from '../../core/renderer.js'
import { resolveCssPaths } from '../../core/html-generator.js'
import { DEFAULT_STYLESHEET } from '../../core/styles.js'
import { runRender, handleCheck } from './run-render.js'
import { startWatch } from './watch.js'
import {
	readStdin,
	isStdinInput,
	type WatchHandle,
	type RenderCommandOptions,
	type RenderContext,
} from './types.js'

export type { WatchHandle, RenderCommandOptions } from './types.js'

export async function renderCommand(
	inputFile: string | undefined,
	options: RenderCommandOptions,
	cwd: string = process.cwd(),
): Promise<WatchHandle | void> {
	const skipCheck = options.check === false

	if (options.check && options.watch) {
		throw new Error('--check cannot be used with --watch')
	}

	if (isStdinInput(inputFile)) {
		if (options.watch) {
			throw new Error('--watch cannot be used with stdin input')
		}

		const rawContent = await readStdin()
		const parsed = parseFrontmatterFromString(rawContent)
		if (!parsed.ok) {
			throw new Error(parsed.error)
		}

		if (!skipCheck) {
			const proceed = await handleCheck(
				rawContent,
				'stdin',
				options,
				parsed.config?.validate,
			)
			if (!proceed) return
		}

		const nameFromContent = extractNameFromContent(rawContent)
		const outputOverride = options.output && !options.output.endsWith('/')

		if (!nameFromContent && !outputOverride) {
			throw new Error(
				'Cannot determine output filename from stdin (no h1 heading found). Use -o to specify.',
			)
		}

		const context: RenderContext = {
			label: 'stdin',
			defaultOutputName: nameFromContent ?? '',
			cssBaseDir: cwd,
		}
		await runRender(parsed, options, cwd, context)
		return
	}

	const file = inputFile ?? 'resume.md'
	const inputPath = resolve(cwd, file)

	if (!existsSync(inputPath)) {
		throw new Error(`Input file not found: ${inputPath}`)
	}

	const mdDir = dirname(inputPath)

	const context: RenderContext = {
		label: relative(cwd, inputPath),
		defaultOutputName: getOutputName(inputPath),
		cssBaseDir: mdDir,
	}

	const rawContent = readFileSync(inputPath, 'utf-8')
	const parsed = parseFrontmatterFromString(rawContent)
	if (!parsed.ok) {
		throw new Error(parsed.error)
	}

	if (!skipCheck) {
		const proceed = await handleCheck(
			rawContent,
			context.label,
			options,
			parsed.config?.validate,
		)
		if (!proceed) return
	}

	let cssPaths: string[] = []
	try {
		const resolvedCss =
			options.css && options.css.length > 0 ?
				options.css
			:	(parsed.config?.css ?? null)
		cssPaths = resolveCssPaths(resolvedCss, mdDir)
	} catch {
		// Will error during render
	}

	const userCssPaths = cssPaths.filter(
		p => p !== DEFAULT_STYLESHEET && existsSync(p),
	)

	await runRender(parsed, options, cwd, context)

	if (!options.watch) return

	return startWatch({
		inputPath,
		cwd,
		options,
		context,
		parsed,
		skipCheck,
		userCssPaths,
	})
}
