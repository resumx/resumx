import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BUNDLED_STYLES_DIR = resolve(__dirname, '../../styles')

export const DEFAULT_STYLESHEET = join(BUNDLED_STYLES_DIR, 'default.css')

export function getBundledStylesDir(): string {
	return BUNDLED_STYLES_DIR
}

export type {
	ThemeVariables,
	CssVariable,
} from '../lib/css-engine/css-variables.js'
export {
	mergeVariables,
	generateVariablesCSS,
	parseCssVariables,
} from '../lib/css-engine/css-variables.js'
