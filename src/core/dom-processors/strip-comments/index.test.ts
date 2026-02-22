import { describe, it, expect } from 'vitest'
import { stripComments } from './index.js'
import type { PipelineContext } from '../types.js'

const ctx: PipelineContext = {
	config: {},
	env: { css: '' },
}

describe('stripComments', () => {
	it('removes a block-level HTML comment', () => {
		const html = '<p>before</p><!-- block comment --><p>after</p>'
		const result = stripComments(html, ctx)

		expect(result).not.toContain('<!--')
		expect(result).toContain('<p>before</p>')
		expect(result).toContain('<p>after</p>')
	})

	it('removes an inline HTML comment inside a paragraph', () => {
		const html = '<p>hello <!-- inline --> world</p>'
		const result = stripComments(html, ctx)

		expect(result).not.toContain('<!--')
		expect(result).toContain('hello')
		expect(result).toContain('world')
	})

	it('removes multiple consecutive comments', () => {
		const html = '<p>a</p><!-- one --><!-- two --><!-- three --><p>b</p>'
		const result = stripComments(html, ctx)

		expect(result).not.toContain('<!--')
		expect(result).toContain('<p>a</p>')
		expect(result).toContain('<p>b</p>')
	})

	it('removes multi-line comments', () => {
		const html = '<p>before</p><!--\nline1\nline2\n--><p>after</p>'
		const result = stripComments(html, ctx)

		expect(result).not.toContain('<!--')
		expect(result).toContain('<p>before</p>')
		expect(result).toContain('<p>after</p>')
	})

	it('preserves non-comment HTML unchanged', () => {
		const html = '<h1>Title</h1><p>Content</p>'
		const result = stripComments(html, ctx)

		expect(result).toBe(html)
	})

	it('handles empty input', () => {
		expect(stripComments('', ctx)).toBe('')
	})

	it('removes comments mixed with element content', () => {
		const html = '<ul><li>item 1</li><!-- hidden --><li>item 2</li></ul>'
		const result = stripComments(html, ctx)

		expect(result).not.toContain('<!--')
		expect(result).toContain('<li>item 1</li>')
		expect(result).toContain('<li>item 2</li>')
	})
})
