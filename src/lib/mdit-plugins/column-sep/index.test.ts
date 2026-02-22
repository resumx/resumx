import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import { bracketedSpans } from '../bracketed-span/index.js'
import { columnSep } from './index.js'

describe('columnSep plugin', () => {
	function createMd() {
		return new MarkdownIt().use(bracketedSpans).use(columnSep).use(attrs)
	}

	it('trims whitespace adjacent to || (like table cells)', () => {
		const md = createMd()
		expect(md.renderInline('Company || Date')).toBe(
			'<span class="col">Company</span><span class="col">Date</span>',
		)
	})

	it('handles multiple || separators', () => {
		const md = createMd()
		expect(md.renderInline('A || B || C')).toBe(
			'<span class="col">A</span><span class="col">B</span><span class="col">C</span>',
		)
	})

	it('does not convert single |', () => {
		const md = createMd()
		expect(md.renderInline('email | phone | github')).toBe(
			'email | phone | github',
		)
	})

	it('ignores || inside code spans', () => {
		const md = createMd()
		expect(md.renderInline('`a || b`')).toBe('<code>a || b</code>')
	})

	it('trims space between emphasis and ||', () => {
		const md = createMd()
		expect(md.renderInline('_Title_ || Location')).toBe(
			'<span class="col"><em>Title</em></span><span class="col">Location</span>',
		)
	})

	it('trims space between bold and ||', () => {
		const md = createMd()
		expect(md.renderInline('**Company** || Date')).toBe(
			'<span class="col"><strong>Company</strong></span><span class="col">Date</span>',
		)
	})

	it('produces col spans in block-level rendering', () => {
		const md = createMd()
		const result = md.render('### Company || Date')
		expect(result).toContain('<span class="col">')
		expect(result).toContain('<h3>')
		expect(result).not.toContain('col-sep')
	})

	it('handles || at the start of inline content', () => {
		const md = createMd()
		expect(md.renderInline('|| Right')).toBe(
			'<span class="col"></span><span class="col">Right</span>',
		)
	})

	it('handles || at the end of inline content', () => {
		const md = createMd()
		expect(md.renderInline('Left ||')).toBe(
			'<span class="col">Left</span><span class="col"></span>',
		)
	})

	it('handles escaped \\|| as literal text', () => {
		const md = createMd()
		const result = md.renderInline('A \\|| B')
		expect(result).not.toContain('col')
		expect(result).toContain('||')
	})

	it('works alongside bracketed spans and attrs', () => {
		const md = createMd()
		expect(md.renderInline('Company || [Date]{.muted}')).toBe(
			'<span class="col">Company</span><span class="col"><span class="muted">Date</span></span>',
		)
	})

	it('preserves non-adjacent whitespace', () => {
		const md = createMd()
		expect(md.renderInline('two words || more words')).toBe(
			'<span class="col">two words</span><span class="col">more words</span>',
		)
	})
})
