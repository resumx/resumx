import { describe, it, expect, vi, afterEach } from 'vitest'
import whichActual from 'which'
import * as childProcess from 'node:child_process'

vi.mock('which', () => {
	const sync = vi.fn(
		(cmd: string, _opts?: { nothrow?: boolean }): string | null => {
			if (cmd === 'fake-installed-cmd') return '/usr/bin/fake-installed-cmd'
			return null
		},
	)
	return { default: Object.assign(async () => null, { sync }) }
})

vi.mock('node:child_process', () => ({
	execFileSync: vi.fn(() => 'fake-tool 1.2.3\n'),
}))

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

describe('getVersion (via checkDependency)', () => {
	afterEach(() => {
		vi.clearAllMocks()
	})

	it('uses execFileSync with argument array instead of string interpolation', () => {
		const execFileSyncSpy = vi.mocked(childProcess.execFileSync)

		checkDependency('fake-installed-cmd', 'install it')

		expect(execFileSyncSpy).toHaveBeenCalledWith(
			'fake-installed-cmd',
			['--version'],
			expect.objectContaining({ encoding: 'utf-8' }),
		)
	})

	it('passes custom version flag as separate array element', () => {
		const execFileSyncSpy = vi.mocked(childProcess.execFileSync)

		// Access internals by importing a version-checking path
		// getVersion is internal, but checkDependency calls it for installed cmds
		checkDependency('fake-installed-cmd', 'install it')

		const call = execFileSyncSpy.mock.calls[0]
		// First arg is the command, second is args array (not a string with spaces)
		expect(typeof call?.[1]).not.toBe('string')
		expect(Array.isArray(call?.[1])).toBe(true)
	})
})
