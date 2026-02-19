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
	it(':foo: parses as icon token with content foo', () => {
		const tokens = getInlineTokens(':foo:')
		const iconToken = tokens.find(t => t.type === 'icon')
		expect(iconToken).toBeDefined()
		expect(iconToken?.content).toBe('foo')
	})

	it(':x: matches minimum length', () => {
		const tokens = getInlineTokens(':x:')
		const iconToken = tokens.find(t => t.type === 'icon')
		expect(iconToken?.content).toBe('x')
	})

	it(':react: parses icon in middle of text', () => {
		const tokens = getInlineTokens('hello :react: world')
		const iconToken = tokens.find(t => t.type === 'icon')
		expect(iconToken?.content).toBe('react')
	})

	it(':devicon/react: parses as icon token with content devicon/react', () => {
		const tokens = getInlineTokens(':devicon/react:')
		const iconToken = tokens.find(t => t.type === 'icon')
		expect(iconToken?.content).toBe('devicon/react')
	})

	it(':mdi/home: parses as icon token with content mdi/home', () => {
		const tokens = getInlineTokens(':mdi/home:')
		const iconToken = tokens.find(t => t.type === 'icon')
		expect(iconToken?.content).toBe('mdi/home')
	})

	it(':simple-icons/docker: parses as icon with content simple-icons/docker', () => {
		const tokens = getInlineTokens(':simple-icons/docker:')
		const iconToken = tokens.find(t => t.type === 'icon')
		expect(iconToken?.content).toBe('simple-icons/docker')
	})

	it(':meta: followed by text does not greedily consume as namespace', () => {
		const tokens = getInlineTokens(':meta:Meta is great')
		const iconToken = tokens.find(t => t.type === 'icon')
		expect(iconToken?.content).toBe('meta')
	})

	it('does not match :foo/: (slash with no name after)', () => {
		const tokens = getInlineTokens(':foo/:')
		expect(tokens.some(t => t.type === 'icon')).toBe(false)
	})

	it('does not match :/foo: (slash at start)', () => {
		const tokens = getInlineTokens(':/foo:')
		expect(tokens.some(t => t.type === 'icon')).toBe(false)
	})

	it('allows only one slash (namespace)', () => {
		const tokens = getInlineTokens(':a/b/c:')
		expect(tokens.some(t => t.type === 'icon')).toBe(false)
	})

	it('adjacent icons :smile::react: produces two icon tokens', () => {
		const tokens = getInlineTokens(':smile::react:')
		const iconTokens = tokens.filter(t => t.type === 'icon')
		expect(iconTokens).toHaveLength(2)
		expect(iconTokens[0]?.content).toBe('smile')
		expect(iconTokens[1]?.content).toBe('react')
	})

	it('does not match : space: (space after opening colon)', () => {
		const tokens = getInlineTokens(': space:')
		expect(tokens.some(t => t.type === 'icon')).toBe(false)
	})

	it('does not match :: (empty)', () => {
		const tokens = getInlineTokens('::')
		expect(tokens.some(t => t.type === 'icon')).toBe(false)
	})

	it('does not match names with invalid chars like :foo bar: (space in name)', () => {
		const tokens = getInlineTokens(':foo bar:')
		expect(tokens.some(t => t.type === 'icon')).toBe(false)
	})

	it('does not match :foo.bar: (period not a valid name char)', () => {
		const tokens = getInlineTokens(':foo.bar:')
		expect(tokens.some(t => t.type === 'icon')).toBe(false)
	})
})
