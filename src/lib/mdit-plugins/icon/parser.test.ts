import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { icon } from './plugin.js'

const md = new MarkdownIt().use(icon)

/** Inline mode: single block token with type 'inline'; its children are the inline tokens. */
function getInlineTokens(src: string): { type: string; content?: string }[] {
	const blocks = md.parseInline(src, {})
	const inlineBlock = blocks.find(t => t.type === 'inline')
	return inlineBlock?.children ?? []
}

describe('icon parser', () => {
	it('parses ::name:: as icon token', () => {
		const tokens = getInlineTokens('::foo::')
		const iconToken = tokens.find(t => t.type === 'icon')
		expect(iconToken).toBeDefined()
		expect(iconToken?.content).toBe('foo')
	})

	it('does not match single colon :one:', () => {
		const tokens = getInlineTokens(':one:')
		expect(tokens.some(t => t.type === 'icon')).toBe(false)
	})

	it('does not match :: :: (space after opening)', () => {
		const tokens = getInlineTokens(':: ::')
		expect(tokens.some(t => t.type === 'icon')).toBe(false)
	})

	it('reserves :::text::: (no icon token; triple-colon syntax preserved for future use)', () => {
		const tokens = getInlineTokens(':::three:::')
		expect(tokens.some(t => t.type === 'icon')).toBe(false)
		const textContent = tokens.map(t => t.content ?? '').join('')
		expect(textContent).toBe(':::three:::')
	})

	it.each([4, 5, 6, 7, 8, 9, 10])(
		'reserves %s colons each side (preserved as text)',
		n => {
			const delims = ':'.repeat(n)
			const src = `${delims}test${delims}`
			const tokens = getInlineTokens(src)
			expect(tokens.some(t => t.type === 'icon')).toBe(false)
			const textContent = tokens.map(t => t.content ?? '').join('')
			expect(textContent).toBe(src)
		},
	)

	it('matches minimum length ::x::', () => {
		const tokens = getInlineTokens('::x::')
		const iconToken = tokens.find(t => t.type === 'icon')
		expect(iconToken?.content).toBe('x')
	})

	it('parses icon in middle of text', () => {
		const tokens = getInlineTokens('hello ::react:: world')
		const iconToken = tokens.find(t => t.type === 'icon')
		expect(iconToken?.content).toBe('react')
	})
})
