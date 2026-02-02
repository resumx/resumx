import { describe, it, expect } from 'vitest'
import {
	createMarkdownRenderer,
	markdownRenderer,
	renderMarkdown,
} from './markdown.js'

describe('markdown', () => {
	describe('createMarkdownRenderer', () => {
		it('creates a markdown-it instance', () => {
			const md = createMarkdownRenderer()
			expect(md).toBeDefined()
			expect(typeof md.render).toBe('function')
		})

		it('creates independent instances', () => {
			const md1 = createMarkdownRenderer()
			const md2 = createMarkdownRenderer()
			expect(md1).not.toBe(md2)
		})
	})

	describe('markdownRenderer (default instance)', () => {
		it('is a valid markdown-it instance', () => {
			expect(markdownRenderer).toBeDefined()
			expect(typeof markdownRenderer.render).toBe('function')
		})
	})

	describe('renderMarkdown', () => {
		it('renders basic markdown', () => {
			const html = renderMarkdown('# Hello World')
			expect(html).toContain('<h1>Hello World</h1>')
		})

		it('renders paragraphs', () => {
			const html = renderMarkdown('This is a paragraph.')
			expect(html).toContain('<p>This is a paragraph.</p>')
		})

		it('renders lists', () => {
			const html = renderMarkdown('- Item 1\n- Item 2')
			expect(html).toContain('<ul>')
			expect(html).toContain('<li>Item 1</li>')
			expect(html).toContain('<li>Item 2</li>')
		})

		it('renders bold and italic', () => {
			const html = renderMarkdown('**bold** and *italic*')
			expect(html).toContain('<strong>bold</strong>')
			expect(html).toContain('<em>italic</em>')
		})

		it('renders inline code', () => {
			const html = renderMarkdown('Use `code` here')
			expect(html).toContain('<code>code</code>')
		})

		it('renders links', () => {
			const html = renderMarkdown('[Link](https://example.com)')
			expect(html).toContain('href="https://example.com"')
			expect(html).toContain('>Link</a>')
		})

		it('renders blockquotes', () => {
			const html = renderMarkdown('> This is a quote')
			expect(html).toContain('<blockquote>')
			expect(html).toContain('This is a quote')
		})

		it('renders HTML passthrough', () => {
			const html = renderMarkdown('<div class="custom">Content</div>')
			expect(html).toContain('<div class="custom">Content</div>')
		})

		it('renders definition lists (dl plugin)', () => {
			const html = renderMarkdown('Term\n: Definition')
			expect(html).toContain('<dl>')
			expect(html).toContain('<dt>Term</dt>')
			expect(html).toContain('<dd>Definition</dd>')
		})

		it('renders bracketed spans with attributes', () => {
			const html = renderMarkdown('[Text]{.highlight}')
			expect(html).toContain('class="highlight"')
		})

		it('renders mark/highlight (mark plugin)', () => {
			const html = renderMarkdown('==highlighted==')
			expect(html).toContain('<mark>')
			expect(html).toContain('highlighted')
		})

		it('renders subscript (sub plugin)', () => {
			const html = renderMarkdown('H~2~O')
			expect(html).toContain('<sub>2</sub>')
		})

		it('renders superscript (sup plugin)', () => {
			const html = renderMarkdown('E=mc^2^')
			expect(html).toContain('<sup>2</sup>')
		})

		it('enables linkify', () => {
			const html = renderMarkdown('Visit https://example.com today')
			expect(html).toContain('href="https://example.com"')
		})

		it('enables typographer (smart quotes)', () => {
			// Typographer converts -- to en-dash and --- to em-dash
			const html = renderMarkdown('text -- more --- even more')
			expect(html).toContain('–') // en-dash
			expect(html).toContain('—') // em-dash
		})
	})
})
