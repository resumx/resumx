import { execSync } from 'node:child_process'

export interface DependencyStatus {
	name: string
	installed: boolean
	version?: string
	installHint?: string
}

/**
 * Check if a command exists in PATH
 */
function commandExists(cmd: string): boolean {
	try {
		execSync(`which ${cmd}`, { stdio: 'ignore' })
		return true
	} catch {
		return false
	}
}

/**
 * Get version of a command
 */
function getVersion(
	cmd: string,
	versionFlag = '--version',
): string | undefined {
	try {
		const output = execSync(`${cmd} ${versionFlag}`, {
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		})
		// Extract first line and clean it up
		const firstLine = output.split('\n')[0]?.trim()
		return firstLine
	} catch {
		return undefined
	}
}

/**
 * Check pandoc installation
 */
export function checkPandoc(): DependencyStatus {
	const installed = commandExists('pandoc')
	return {
		name: 'pandoc',
		installed,
		version: installed ? getVersion('pandoc') : undefined,
		installHint: 'brew install pandoc',
	}
}

/**
 * Check weasyprint installation
 */
export function checkWeasyprint(): DependencyStatus {
	const installed = commandExists('weasyprint')
	return {
		name: 'weasyprint',
		installed,
		version: installed ? getVersion('weasyprint') : undefined,
		installHint: 'brew install weasyprint',
	}
}

/**
 * Check all required dependencies
 */
export function checkDependencies(): {
	pandoc: DependencyStatus
	weasyprint: DependencyStatus
	allInstalled: boolean
} {
	const pandoc = checkPandoc()
	const weasyprint = checkWeasyprint()

	return {
		pandoc,
		weasyprint,
		allInstalled: pandoc.installed && weasyprint.installed,
	}
}

/**
 * Require dependencies or throw
 */
export function requireDependencies(options: { pdf?: boolean } = {}): void {
	const pandoc = checkPandoc()
	if (!pandoc.installed) {
		throw new Error(
			`pandoc is required but not installed. Install with: ${pandoc.installHint}`,
		)
	}

	if (options.pdf !== false) {
		const weasyprint = checkWeasyprint()
		if (!weasyprint.installed) {
			throw new Error(
				`weasyprint is required for PDF output. Install with: ${weasyprint.installHint}`,
			)
		}
	}
}
