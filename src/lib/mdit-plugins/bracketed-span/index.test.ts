import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import { bracketedSpans } from './index.js'

describe('bracketedSpans plugin', () => {
	// Helper function to create markdown-it instance with both plugins
	function createMd() {
		return new MarkdownIt().use(bracketedSpans).use(attrs)
	}

	it('converts basic bracketed span syntax', () => {
		const md = createMd()
		expect(md.renderInline('[hello]{.class}')).toBe(
			'<span class="class">hello</span>',
		)
	})

	it('works with multiple CSS classes', () => {
		const md = createMd()
		expect(md.renderInline('[text]{.class1 .class2}')).toBe(
			'<span class="class1 class2">text</span>',
		)
	})

	it('works with id attributes', () => {
		const md = createMd()
		expect(md.renderInline('[text]{#my-id}')).toBe(
			'<span id="my-id">text</span>',
		)
	})

	it('works with mixed attributes', () => {
		const md = createMd()
		expect(md.renderInline('[text]{.class #id data-test="value"}')).toBe(
			'<span class="class" id="id" data-test="value">text</span>',
		)
	})

	it('handles empty brackets', () => {
		const md = createMd()
		expect(md.renderInline('[]{}')).toBe('[]{}')
	})

	it('preserves text without brackets', () => {
		const md = createMd()
		expect(md.renderInline('regular text')).toBe('regular text')
	})

	it('ignores brackets without attributes', () => {
		const md = createMd()
		expect(md.renderInline('[text]')).toBe('[text]')
	})

	it('ignores malformed bracket syntax', () => {
		const md = createMd()
		expect(md.renderInline('[text{.class}')).toBe('[text{.class}')
		expect(md.renderInline('text]{.class}')).toBe('text]{.class}')
	})

	// Note: Nested spans work in practice but have parsing edge cases in tests
	// The resume.md example [Sept 2018 - [June 2022]{.text-blue-900}]{.float-right} works correctly in the application

	// Additional nested span tests would be added here once the parsing issues are resolved

	it('handles adjacent spans', () => {
		const md = createMd()
		expect(md.renderInline('[first]{.a}[second]{.b}')).toBe(
			'<span class="a">first</span><span class="b">second</span>',
		)
	})

	it('handles spans with inline code', () => {
		const md = createMd()
		expect(md.renderInline('[code `[inline]{.highlight}` here]{.block}')).toBe(
			'<span class="block">code <code>[inline]{.highlight}</code> here</span>',
		)
	})

	it('preserves whitespace and formatting', () => {
		const md = createMd()
		expect(md.renderInline('[  spaced  text  ]{.class}')).toBe(
			'<span class="class">  spaced  text  </span>',
		)
	})

	it('handles escaped brackets correctly', () => {
		const md = createMd()
		expect(md.renderInline('\\[not a span]{.class}')).toBe(
			'[not a span]{.class}',
		)
	})

	it('works with markdown-it-attrs in different orders', () => {
		// Test with attrs before bracketedSpans
		const md1 = new MarkdownIt().use(attrs).use(bracketedSpans)
		expect(md1.renderInline('[text]{.class}')).toBe(
			'<span class="class">text</span>',
		)

		// Test with bracketedSpans before attrs (recommended)
		const md2 = new MarkdownIt().use(bracketedSpans).use(attrs)
		expect(md2.renderInline('[text]{.class}')).toBe(
			'<span class="class">text</span>',
		)
	})

	it('ignores empty attributes', () => {
		const md = createMd()
		expect(md.renderInline('[text]{}')).toBe('[text]{}')
	})

	it('ignores whitespace-only attributes', () => {
		const md = createMd()
		expect(md.renderInline('[text]{  }')).toBe('[text]{  }')
	})

	it('works with links containing bracketed spans in link text', () => {
		const md = createMd()
		// Note: This is a known limitation - bracketed spans inside link text don't work
		// because the link parser consumes the outer brackets first. To use styled text
		// in links, wrap the link in a span instead: [[link](url)]{.class}
		expect(
			md.renderInline(
				'[link with [styled]{.highlight} text](https://example.com)',
			),
		).toBe(
			'[link with <span class="highlight">styled</span> text](https://example.com)',
		)
	})

	it('works with spans wrapping links', () => {
		const md = createMd()
		expect(
			md.renderInline('[[link text](https://example.com)]{.highlight}'),
		).toBe(
			'<span class="highlight"><a href="https://example.com">link text</a></span>',
		)
	})

	it('handles simple nested spans', () => {
		const md = createMd()
		expect(md.renderInline('[outer [inner]{.inner}]{.outer}')).toBe(
			'<span class="outer">outer <span class="inner">inner</span></span>',
		)
	})

	it('handles complex nested spans with dates (real-world example)', () => {
		const md = createMd()
		expect(
			md.renderInline(
				'[Sept 2018 - [June 2022]{.text-blue-900}]{.float-right}',
			),
		).toBe(
			'<span class="float-right">Sept 2018 - <span class="text-blue-900">June 2022</span></span>',
		)
	})

	it('handles multiple nested spans at same level', () => {
		const md = createMd()
		expect(
			md.renderInline('[text with [first]{.a} and [second]{.b} spans]{.outer}'),
		).toBe(
			'<span class="outer">text with <span class="a">first</span> and <span class="b">second</span> spans</span>',
		)
	})

	it('handles deeply nested spans', () => {
		const md = createMd()
		expect(md.renderInline('[level1 [level2 [level3]{.c}]{.b}]{.a}')).toBe(
			'<span class="a">level1 <span class="b">level2 <span class="c">level3</span></span></span>',
		)
	})

	it('handles 10 layers of nested spans', () => {
		const md = createMd()
		expect(
			md.renderInline(
				'[L1 [L2 [L3 [L4 [L5 [L6 [L7 [L8 [L9 [L10]{.l10}]{.l9}]{.l8}]{.l7}]{.l6}]{.l5}]{.l4}]{.l3}]{.l2}]{.l1}',
			),
		).toBe(
			'<span class="l1">L1 <span class="l2">L2 <span class="l3">L3 <span class="l4">L4 <span class="l5">L5 <span class="l6">L6 <span class="l7">L7 <span class="l8">L8 <span class="l9">L9 <span class="l10">L10</span></span></span></span></span></span></span></span></span></span>',
		)
	})
})
