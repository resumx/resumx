import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as childProcess from 'node:child_process'

vi.mock('node:child_process', () => ({
	execFileSync: vi.fn(),
}))

vi.mock('../lib/browser-pool/index.js', () => ({
	browserPool: {
		acquire: vi.fn().mockResolvedValue({
			newPage: vi.fn().mockResolvedValue({
				setContent: vi.fn().mockResolvedValue(undefined),
				pdf: vi.fn().mockResolvedValue(undefined),
				close: vi.fn().mockResolvedValue(undefined),
			}),
		}),
		release: vi.fn(),
	},
}))

vi.mock('./html-generator.js', () => ({
	generateHtml: vi.fn().mockResolvedValue('<html><body>Test</body></html>'),
}))

import { render } from './renderer.js'

describe('renderDocxFromPdf', () => {
	beforeEach(() => {
		vi.mocked(childProcess.execFileSync).mockClear()
	})

	it('calls execFileSync with argument array instead of string interpolation', async () => {
		const execFileSyncMock = vi.mocked(childProcess.execFileSync)

		await render({
			content: '# Test\n\nContent',
			output: '/tmp/output.docx',
			format: 'docx',
			cssPath: '/fake/style.css',
		})

		expect(execFileSyncMock).toHaveBeenCalledWith(
			'pdf2docx',
			expect.arrayContaining(['convert']),
			expect.anything(),
		)

		const call = execFileSyncMock.mock.calls[0]
		expect(typeof call?.[1]).not.toBe('string')
		expect(Array.isArray(call?.[1])).toBe(true)
	})

	it('passes pdf path and output path as separate array elements', async () => {
		const execFileSyncMock = vi.mocked(childProcess.execFileSync)

		await render({
			content: '# Test\n\nContent',
			output: '/tmp/output.docx',
			format: 'docx',
			cssPath: '/fake/style.css',
		})

		const call = execFileSyncMock.mock.calls[0]
		const args = call?.[1] as string[]

		expect(args[0]).toBe('convert')
		expect(args[1]).toMatch(/\.pdf$/)
		expect(args[2]).toBe('/tmp/output.docx')
	})
})
