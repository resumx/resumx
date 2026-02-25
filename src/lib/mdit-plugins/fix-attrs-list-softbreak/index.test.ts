import { describe, it, expect } from 'vitest'
import { parseHTML } from 'linkedom'
import MarkdownIt from 'markdown-it'
import attrs from 'markdown-it-attrs'
import { bracketedSpans } from '../bracketed-span/index.js'
import { fixAttrsListSoftbreak } from './index.js'

function parseHtml(html: string) {
	const { document } = parseHTML(`<div id="root">${html}</div>`)
	const root = document.getElementById('root')!
	return {
		body: root,
		querySelector: (selector: string) => root.querySelector(selector),
		querySelectorAll: (selector: string) => root.querySelectorAll(selector),
	}
}

describe('fixAttrsListSoftbreak', () => {
	function createMd() {
		return new MarkdownIt()
			.use(bracketedSpans)
			.use(attrs)
			.use(fixAttrsListSoftbreak)
	}

	function createMdWithoutFix() {
		return new MarkdownIt().use(bracketedSpans).use(attrs)
	}

	describe('confirms the upstream bug exists', () => {
		it('without fix: attrs after softbreak apply to <ul> instead of <li>', () => {
			const md = createMdWithoutFix()
			const doc = parseHtml(md.render('- text\n  {.my-class}'))
			expect(doc.querySelector('ul')?.getAttribute('class')).toBe('my-class')
			expect(doc.querySelector('li')?.getAttribute('class')).toBeFalsy()
		})
	})

	describe('plain text + continuation attrs', () => {
		it('applies attrs to <li> when on continuation line', () => {
			const md = createMd()
			const doc = parseHtml(md.render('- text\n  {.my-class}'))
			expect(doc.querySelector('li')?.getAttribute('class')).toBe('my-class')
			expect(doc.querySelector('ul')?.getAttribute('class')).toBeFalsy()
		})

		it('preserves text content', () => {
			const md = createMd()
			const doc = parseHtml(md.render('- some text\n  {.highlight}'))
			expect(doc.querySelector('li')?.textContent?.trim()).toBe('some text')
		})
	})

	describe('single-line baseline (unaffected)', () => {
		it('attrs at end of line apply to <li>', () => {
			const md = createMd()
			const doc = parseHtml(md.render('- text {.my-class}'))
			expect(doc.querySelector('li')?.getAttribute('class')).toBe('my-class')
			expect(doc.querySelector('ul')?.getAttribute('class')).toBeFalsy()
		})
	})

	describe('bracketed spans + continuation attrs', () => {
		it('applies role to <li> with single span', () => {
			const md = createMd()
			const doc = parseHtml(md.render('- [Text]{lang=en}\n  {.@backend}'))
			expect(doc.querySelector('li')?.getAttribute('class')).toBe('@backend')
			expect(doc.querySelector('span')?.getAttribute('lang')).toBe('en')
			expect(doc.querySelector('ul')?.getAttribute('class')).toBeFalsy()
		})

		it('applies role to <li> with two lang spans', () => {
			const md = createMd()
			const input = [
				'- [Designed REST APIs with OpenAPI spec]{lang=en}',
				"  [Conception d'API REST avec OpenAPI]{lang=fr}",
				'  {.@backend}',
			].join('\n')
			const doc = parseHtml(md.render(input))

			expect(doc.querySelector('li')?.getAttribute('class')).toBe('@backend')
			const spans = doc.querySelectorAll('span')
			expect(spans.length).toBe(2)
			expect(spans[0].getAttribute('lang')).toBe('en')
			expect(spans[1].getAttribute('lang')).toBe('fr')
			expect(doc.querySelector('ul')?.getAttribute('class')).toBeFalsy()
		})

		it('matches single-line behavior', () => {
			const md = createMd()
			const singleLine = '- [Text]{lang=en} [Texte]{lang=fr} {.@backend}'
			const multiLine = '- [Text]{lang=en}\n  [Texte]{lang=fr}\n  {.@backend}'

			const singleDoc = parseHtml(md.render(singleLine))
			const multiDoc = parseHtml(md.render(multiLine))

			expect(singleDoc.querySelector('li')?.getAttribute('class')).toBe(
				multiDoc.querySelector('li')?.getAttribute('class'),
			)
			expect(singleDoc.querySelector('ul')?.getAttribute('class')).toBeFalsy()
			expect(multiDoc.querySelector('ul')?.getAttribute('class')).toBeFalsy()
		})
	})

	describe('multiple list items', () => {
		it('applies attrs to each respective <li>', () => {
			const md = createMd()
			const input = [
				'- [React]{lang=en}\n  {.@frontend}',
				'- [Node.js]{lang=en}\n  {.@backend}',
			].join('\n')
			const doc = parseHtml(md.render(input))

			const items = doc.querySelectorAll('li')
			expect(items.length).toBe(2)
			expect(items[0].getAttribute('class')).toBe('@frontend')
			expect(items[1].getAttribute('class')).toBe('@backend')
		})

		it('items without continuation attrs are unaffected', () => {
			const md = createMd()
			const input = [
				'- React {.@frontend}',
				'- Node.js\n  {.@backend}',
				'- Common skill',
			].join('\n')
			const doc = parseHtml(md.render(input))

			const items = doc.querySelectorAll('li')
			expect(items.length).toBe(3)
			expect(items[0].getAttribute('class')).toBe('@frontend')
			expect(items[1].getAttribute('class')).toBe('@backend')
			expect(items[2].getAttribute('class')).toBeFalsy()
		})
	})

	describe('multiple content lines before attrs', () => {
		it('preserves softbreaks between content lines', () => {
			const md = createMd()
			const input = '- line1\n  line2\n  {.my-class}'
			const doc = parseHtml(md.render(input))

			expect(doc.querySelector('li')?.getAttribute('class')).toBe('my-class')
			expect(doc.querySelector('li')?.textContent).toContain('line1')
			expect(doc.querySelector('li')?.textContent).toContain('line2')
		})
	})

	describe('ordered lists', () => {
		it('applies attrs to <li> in ordered lists too', () => {
			const md = createMd()
			const doc = parseHtml(md.render('1. text\n   {.my-class}'))
			expect(doc.querySelector('li')?.getAttribute('class')).toBe('my-class')
			expect(doc.querySelector('ol')?.getAttribute('class')).toBeFalsy()
		})
	})

	describe('edge cases', () => {
		it('does not modify items with fewer than 3 inline children', () => {
			const md = createMd()
			// Single text + attrs on same line — only 1 child, unaffected
			const doc = parseHtml(md.render('- text {.my-class}'))
			expect(doc.querySelector('li')?.getAttribute('class')).toBe('my-class')
		})

		it('does not modify when last child is not attrs-only', () => {
			const md = createMd()
			// Text after softbreak is not attrs-only
			const doc = parseHtml(md.render('- line1\n  line2'))
			expect(doc.querySelector('li')?.getAttribute('class')).toBeFalsy()
			expect(doc.querySelector('li')?.textContent).toContain('line1')
			expect(doc.querySelector('li')?.textContent).toContain('line2')
		})

		it('handles multiple attrs in braces', () => {
			const md = createMd()
			const doc = parseHtml(md.render('- text\n  {.@backend lang=en}'))
			expect(doc.querySelector('li')?.getAttribute('class')).toBe('@backend')
			expect(doc.querySelector('li')?.getAttribute('lang')).toBe('en')
		})
	})
})
