import type { OutputFormat } from '../../core/renderer.js'
import type { SectionType } from '../../core/section-types.js'
import type { BulletOrder } from '../../core/view/types.js'
import type { Severity } from '../../core/validator/types.js'

export interface WatchHandle {
	close(): Promise<void>
	done: Promise<void>
}

export interface RenderCommandOptions {
	css?: string[]
	output?: string
	style?: string[]
	var?: Record<string, string>
	for?: string[]
	lang?: string[]
	format?: string[]
	watch?: boolean
	pages?: number
	hide?: SectionType[]
	pin?: SectionType[]
	bulletOrder?: BulletOrder
	check?: boolean
	strict?: boolean
	minSeverity?: Severity
}

export interface RenderContext {
	label: string
	defaultOutputName: string
	/** Directory for resolving relative CSS paths (markdown file's dir, or cwd for stdin) */
	cssBaseDir: string
}

const VALID_FORMATS: OutputFormat[] = ['pdf', 'html', 'docx', 'png']

export function resolveFormats(options: RenderCommandOptions): OutputFormat[] {
	if (options.format && options.format.length > 0) {
		for (const f of options.format) {
			if (!VALID_FORMATS.includes(f as OutputFormat)) {
				throw new Error(
					`Unknown format: '${f}'. Valid formats: ${VALID_FORMATS.join(', ')}`,
				)
			}
		}

		return options.format as OutputFormat[]
	}

	return ['pdf']
}

export async function readStdin(): Promise<string> {
	const chunks: Buffer[] = []
	for await (const chunk of process.stdin) {
		chunks.push(Buffer.from(chunk as Buffer))
	}
	return Buffer.concat(chunks).toString('utf-8')
}

export function isStdinInput(file: string | undefined): boolean {
	return file === '-' || (file === undefined && !process.stdin.isTTY)
}
