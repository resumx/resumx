import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { variableSubstitution, type VarsEnv } from './index.js'

function render(markdown: string, vars: Record<string, string>): string {
	const md = new MarkdownIt().use(variableSubstitution)
	const env: VarsEnv = { vars }
	return md.render(markdown, env)
}

function renderTrimmed(markdown: string, vars: Record<string, string>): string {
	return render(markdown, vars).trim()
}

describe('variableSubstitution plugin', () => {
	describe('basic substitution', () => {
		it('replaces a single variable with its value', () => {
			expect(renderTrimmed('Hello {{ name }}', { name: 'World' })).toBe(
				'<p>Hello World</p>',
			)
		})

		it('replaces multiple different variables', () => {
			expect(
				renderTrimmed('{{ greeting }} {{ name }}', {
					greeting: 'Hello',
					name: 'Alice',
				}),
			).toBe('<p>Hello Alice</p>')
		})

		it('replaces the same variable used multiple times', () => {
			expect(renderTrimmed('{{ name }} is {{ name }}', { name: 'Bob' })).toBe(
				'<p>Bob is Bob</p>',
			)
		})
	})

	describe('whitespace variants', () => {
		it('handles no whitespace: {{name}}', () => {
			expect(renderTrimmed('{{name}}', { name: 'Val' })).toBe('<p>Val</p>')
		})

		it('handles extra whitespace: {{  name  }}', () => {
			expect(renderTrimmed('{{  name  }}', { name: 'Val' })).toBe('<p>Val</p>')
		})
	})

	describe('variable name patterns', () => {
		it('handles hyphenated names: {{ my-var }}', () => {
			expect(renderTrimmed('{{ my-var }}', { 'my-var': 'val' })).toBe(
				'<p>val</p>',
			)
		})

		it('handles underscored names: {{ my_var }}', () => {
			expect(renderTrimmed('{{ my_var }}', { my_var: 'val' })).toBe(
				'<p>val</p>',
			)
		})

		it('handles mixed alphanumeric: {{ var2 }}', () => {
			expect(renderTrimmed('{{ var2 }}', { var2: 'val' })).toBe('<p>val</p>')
		})

		it('does not match names starting with digits', () => {
			const md = new MarkdownIt().use(variableSubstitution)
			expect(md.render('{{ 2var }}').trim()).toBe('<p>{{ 2var }}</p>')
		})

		it('does not match names with spaces', () => {
			const md = new MarkdownIt().use(variableSubstitution)
			expect(md.render('{{ my var }}').trim()).toBe('<p>{{ my var }}</p>')
		})
	})

	describe('undefined variables', () => {
		it('replaces undefined placeholder with empty string when vars are provided', () => {
			expect(
				renderTrimmed('{{ name }} and {{ missing }}', { name: 'Bob' }),
			).toBe('<p>Bob and </p>')
		})

		it('removes paragraph when placeholder is the only content', () => {
			const result = render('{{ name }}\n\n{{ missing }}\n\nLine 3', {
				name: 'Bob',
			})
			expect(result).not.toContain('<p></p>')
			expect(result).toContain('<p>Bob</p>')
			expect(result).toContain('<p>Line 3</p>')
		})

		it('keeps paragraph when placeholder is mixed with other content', () => {
			expect(
				renderTrimmed('Hello {{ missing }} {{ name }}', { name: 'Bob' }),
			).toBe('<p>Hello  Bob</p>')
		})
	})

	describe('markdown in variable values', () => {
		it('renders bold in variable value', () => {
			expect(
				renderTrimmed('{{ tagline }}', {
					tagline: '**Senior Engineer** with 10+ years',
				}),
			).toBe('<p><strong>Senior Engineer</strong> with 10+ years</p>')
		})

		it('renders italic in variable value', () => {
			expect(renderTrimmed('{{ role }}', { role: '*Lead Developer*' })).toBe(
				'<p><em>Lead Developer</em></p>',
			)
		})

		it('renders links in variable value', () => {
			expect(
				renderTrimmed('{{ link }}', {
					link: '[GitHub](https://github.com)',
				}),
			).toBe('<p><a href="https://github.com">GitHub</a></p>')
		})
	})

	describe('code block safety', () => {
		it('does not substitute inside inline code', () => {
			expect(
				renderTrimmed('{{ name }} and `{{ name }}`', { name: 'Bob' }),
			).toBe('<p>Bob and <code>{{ name }}</code></p>')
		})

		it('does not substitute inside fenced code blocks', () => {
			const result = render('{{ name }}\n\n```\n{{ name }}\n```', {
				name: 'Bob',
			})
			expect(result).toContain('<p>Bob</p>')
			expect(result).toContain('<code>{{ name }}')
		})
	})

	describe('nested/malformed braces', () => {
		it('handles {{ something {{ v2 }} }} by matching inner only', () => {
			expect(renderTrimmed('{{ something {{ name }} }}', { name: 'Bob' })).toBe(
				'<p>{{ something Bob }}</p>',
			)
		})

		it('ignores single braces', () => {
			const md = new MarkdownIt().use(variableSubstitution)
			expect(md.render('Use { curly } braces').trim()).toBe(
				'<p>Use { curly } braces</p>',
			)
		})
	})

	describe('unused variable detection', () => {
		it('throws when a defined variable has no placeholder in markdown', () => {
			expect(() => render('# Resume', { tagline: 'Hello' })).toThrow(/tagline/)
		})

		it('throws with Levenshtein suggestion when a similar placeholder exists', () => {
			expect(() => render('{{ tagline }}', { taglien: 'Hello' })).toThrow(
				/taglien.*tagline/s,
			)
		})

		it('does not throw when all defined variables are used', () => {
			expect(() =>
				render('{{ name }} {{ role }}', {
					name: 'Alice',
					role: 'Engineer',
				}),
			).not.toThrow()
		})

		it('does not count placeholders inside code blocks as usages', () => {
			expect(() => render('```\n{{ name }}\n```', { name: 'Bob' })).toThrow(
				/name/,
			)
		})
	})

	describe('no vars provided', () => {
		it('renders normally when no vars in env', () => {
			const md = new MarkdownIt().use(variableSubstitution)
			expect(md.render('# Hello').trim()).toBe('<h1>Hello</h1>')
		})

		it('removes placeholders when no vars in env', () => {
			const md = new MarkdownIt().use(variableSubstitution)
			const result = md.render('# Name\n\n{{ tagline }}\n\nMore text')
			expect(result).not.toContain('tagline')
			expect(result).toContain('<h1>Name</h1>')
			expect(result).toContain('<p>More text</p>')
		})

		it('removes inline placeholder when no vars in env', () => {
			const md = new MarkdownIt().use(variableSubstitution)
			expect(md.render('Hello {{ tagline }} world').trim()).toBe(
				'<p>Hello  world</p>',
			)
		})
	})
})
