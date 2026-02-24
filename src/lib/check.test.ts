import { describe, it, expect, vi, afterEach } from 'vitest'
import whichActual from 'which'

vi.mock('which', () => {
	const sync = vi.fn(
		(cmd: string, _opts?: { nothrow?: boolean }): string | null => {
			if (cmd === 'fake-installed-cmd') return '/usr/bin/fake-installed-cmd'
			return null
		},
	)
	return { default: Object.assign(async () => null, { sync }) }
})

import { checkDependency, requireDependencies } from './check.js'

describe('checkDependency', () => {
	afterEach(() => {
		vi.clearAllMocks()
	})

	it('uses the which package to detect installed commands', () => {
		const result = checkDependency('fake-installed-cmd', 'install it')

		expect(whichActual.sync).toHaveBeenCalledWith('fake-installed-cmd', {
			nothrow: true,
		})
		expect(result.installed).toBe(true)
		expect(result.name).toBe('fake-installed-cmd')
	})

	it('reports missing when which returns null', () => {
		const result = checkDependency('nonexistent-tool', 'pip install it')

		expect(whichActual.sync).toHaveBeenCalledWith('nonexistent-tool', {
			nothrow: true,
		})
		expect(result.installed).toBe(false)
		expect(result.version).toBeUndefined()
		expect(result.installHint).toBe('pip install it')
	})
})

describe('requireDependencies', () => {
	it('does not throw when docx is not requested', () => {
		expect(() => requireDependencies()).not.toThrow()
	})
})
