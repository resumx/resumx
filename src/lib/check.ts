import { execSync } from 'node:child_process'
import which from 'which'

export interface DependencyStatus {
	name: string
	installed: boolean
	version?: string
	installHint?: string
}

function commandExists(cmd: string): boolean {
	return which.sync(cmd, { nothrow: true }) !== null
}

function getVersion(
	cmd: string,
	versionFlag = '--version',
): string | undefined {
	try {
		const output = execSync(`${cmd} ${versionFlag}`, {
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		})
		const firstLine = output.split('\n')[0]?.trim()
		return firstLine
	} catch {
		return undefined
	}
}

/**
 * Check dependencies installation
 */
export function checkDependency(
	dep: string,
	installHint: string,
): DependencyStatus {
	const installed = commandExists(dep)
	return {
		name: dep,
		installed,
		version: installed ? getVersion(dep) : undefined,
		installHint,
	}
}

/**
 * Check pdf2docx installation
 */
export const checkPdf2docxInstalled = () =>
	checkDependency('pdf2docx', 'pip install pdf2docx')

/**
 * Require dependencies or throw
 * PDF rendering uses Puppeteer with bundled Chromium (no external deps)
 * pdf2docx is required for DOCX output (converts PDF to DOCX for high fidelity)
 */
export function requireDependencies(options: { docx?: boolean } = {}): void {
	if (options.docx) {
		const pdf2docx = checkPdf2docxInstalled()
		if (!pdf2docx.installed) {
			throw new Error(
				`pdf2docx is required for DOCX output. Install with: ${pdf2docx.installHint}`,
			)
		}
	}
}
