import { describe, it, expect } from 'vitest'
import { processExpressions, evaluateExpression } from './interpolation.js'

describe('expressions', () => {
	describe('evaluateExpression', () => {
		describe('basic expressions', () => {
			it('evaluates arithmetic expressions', async () => {
				const result = await evaluateExpression('1 + 1', {})
				expect(result).toBe('2')
			})

			it('evaluates string expressions', async () => {
				const result = await evaluateExpression('"hello"', {})
				expect(result).toBe('hello')
			})

			it('evaluates Date expressions', async () => {
				const result = await evaluateExpression('new Date().getFullYear()', {})
				expect(result).toBe(String(new Date().getFullYear()))
			})
		})

		describe('context access', () => {
			it('accesses context variables directly', async () => {
				const result = await evaluateExpression('outputName', {
					outputName: 'John_Doe',
				})
				expect(result).toBe('John_Doe')
			})

			it('accesses nested context properties', async () => {
				const result = await evaluateExpression('variables.company', {
					variables: { company: 'Acme Corp' },
				})
				expect(result).toBe('Acme Corp')
			})

			it('uses context in expressions', async () => {
				const result = await evaluateExpression(
					'years > 5 ? "Senior" : "Junior"',
					{
						years: 7,
					},
				)
				expect(result).toBe('Senior')
			})
		})

		describe('complex expressions', () => {
			it('evaluates IIFE for complex logic', async () => {
				const result = await evaluateExpression(
					'(() => { const x = 5; return x * 2; })()',
					{},
				)
				expect(result).toBe('10')
			})

			it('evaluates array methods', async () => {
				const result = await evaluateExpression(
					'[1, 2, 3].map(x => x * 2).join(",")',
					{},
				)
				expect(result).toBe('2,4,6')
			})

			it('evaluates ternary chains', async () => {
				const result = await evaluateExpression(
					'years > 10 ? "Principal" : years > 5 ? "Senior" : "Engineer"',
					{ years: 8 },
				)
				expect(result).toBe('Senior')
			})
		})

		describe('async expressions', () => {
			it('auto-awaits Promise.resolve', async () => {
				const result = await evaluateExpression('Promise.resolve(42)', {})
				expect(result).toBe('42')
			})

			it('auto-awaits chained promises', async () => {
				const result = await evaluateExpression(
					'Promise.resolve({ name: "John" }).then(d => d.name)',
					{},
				)
				expect(result).toBe('John')
			})

			it('auto-awaits async IIFE', async () => {
				const result = await evaluateExpression(
					'(async () => { const x = await Promise.resolve(5); return x * 2; })()',
					{},
				)
				expect(result).toBe('10')
			})
		})

		describe('return value conversion', () => {
			it('converts null to empty string', async () => {
				const result = await evaluateExpression('null', {})
				expect(result).toBe('')
			})

			it('converts undefined to empty string', async () => {
				const result = await evaluateExpression('undefined', {})
				expect(result).toBe('')
			})

			it('converts objects to JSON', async () => {
				const result = await evaluateExpression('({ a: 1, b: 2 })', {})
				expect(result).toBe('{"a":1,"b":2}')
			})

			it('converts arrays to JSON', async () => {
				const result = await evaluateExpression('[1, 2, 3]', {})
				expect(result).toBe('[1,2,3]')
			})

			it('converts numbers to string', async () => {
				const result = await evaluateExpression('42', {})
				expect(result).toBe('42')
			})

			it('converts boolean to string', async () => {
				const result = await evaluateExpression('true', {})
				expect(result).toBe('true')
			})
		})

		describe('error handling', () => {
			it('returns empty string on syntax error', async () => {
				const result = await evaluateExpression('1 +', {})
				expect(result).toBe('')
			})

			it('returns empty string on undefined variable', async () => {
				const result = await evaluateExpression('unknownVar', {})
				expect(result).toBe('')
			})

			it('returns empty string on invalid property access', async () => {
				const result = await evaluateExpression('obj.prop', { obj: null })
				expect(result).toBe('')
			})
		})
	})

	describe('processExpressions', () => {
		describe('basic processing', () => {
			it('returns content unchanged when no expressions', async () => {
				const content = '# Hello World\n\nSome text here.'
				const result = await processExpressions(content, {})
				expect(result).toBe(content)
			})

			it('replaces single expression', async () => {
				const content = 'Year: {{ 2026 }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('Year: 2026')
			})

			it('replaces multiple expressions', async () => {
				const content = '{{ 1 + 1 }} and {{ 2 + 2 }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('2 and 4')
			})

			it('handles expressions with extra whitespace', async () => {
				const content = '{{   1 + 1   }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('2')
			})
		})

		describe('context integration', () => {
			it('uses context for variable substitution', async () => {
				const content = 'Name: {{ outputName }}'
				const result = await processExpressions(content, {
					outputName: 'John_Doe',
				})
				expect(result).toBe('Name: John_Doe')
			})

			it('uses nested context properties', async () => {
				const content = 'Company: {{ variables.company }}'
				const result = await processExpressions(content, {
					variables: { company: 'Acme Corp' },
				})
				expect(result).toBe('Company: Acme Corp')
			})

			it('handles full frontmatter-like context', async () => {
				const content = `Name: {{ outputName }}
Theme: {{ theme }}
Color: {{ variables.primaryColor }}`
				const result = await processExpressions(content, {
					outputName: 'John_Doe_Resume',
					theme: 'formal',
					variables: { primaryColor: '#2563eb' },
				})
				expect(result).toBe(`Name: John_Doe_Resume
Theme: formal
Color: #2563eb`)
			})
		})

		describe('complex content', () => {
			it('handles expressions in markdown', async () => {
				const content = `# Resume

**Years of Experience:** {{ new Date().getFullYear() - 2018 }}

## Skills
- TypeScript`
				const result = await processExpressions(content, {})
				const expectedYears = new Date().getFullYear() - 2018
				expect(result).toContain(`**Years of Experience:** ${expectedYears}`)
			})

			it('handles multiline expressions', async () => {
				const content = `Result: {{ (() => {
  const x = 5;
  return x * 2;
})() }}`
				const result = await processExpressions(content, {})
				expect(result).toBe('Result: 10')
			})

			it('handles async expressions in content', async () => {
				const content = 'Value: {{ Promise.resolve(42) }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('Value: 42')
			})
		})

		describe('edge cases', () => {
			it('handles empty expression', async () => {
				const content = 'Empty: {{  }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('Empty: ')
			})

			it('preserves non-expression curly braces', async () => {
				const content = 'JSON: { "key": "value" }'
				const result = await processExpressions(content, {})
				expect(result).toBe('JSON: { "key": "value" }')
			})

			it('handles expressions at start and end', async () => {
				const content = '{{ "start" }} middle {{ "end" }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('start middle end')
			})
		})

		describe('nested object literals', () => {
			it('handles single-level nested object', async () => {
				const content = 'Config: {{ {debug: true} }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('Config: {"debug":true}')
			})

			it('handles multi-level nested object', async () => {
				const content = 'Config: {{ {config: {debug: true}} }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('Config: {"config":{"debug":true}}')
			})

			it('handles nested object with multiple properties', async () => {
				const content = 'Data: {{ {user: {name: "John", age: 30}} }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('Data: {"user":{"name":"John","age":30}}')
			})

			it('handles nested array of objects', async () => {
				const content = 'Items: {{ [{id: 1}, {id: 2}] }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('Items: [{"id":1},{"id":2}]')
			})

			it('handles string literals containing }}', async () => {
				const content = 'Config: {{ {config: {debug: "}}"}} }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('Config: {"config":{"debug":"}}"}}')
			})

			it('handles string literals containing {{ and }}', async () => {
				const content = 'Template: {{ {template: "{{ value }}"} }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('Template: {"template":"{{ value }}"}')
			})

			it('handles single quotes with }}', async () => {
				const content = "Config: {{ {msg: '}}'} }}"
				const result = await processExpressions(content, {})
				expect(result).toBe('Config: {"msg":"}}"}')
			})

			it('handles escaped quotes in strings', async () => {
				const content = 'Text: {{ {quote: "He said \\"}}\\""} }}'
				const result = await processExpressions(content, {})
				expect(result).toBe('Text: {"quote":"He said \\"}}\\""}')
			})
		})
	})
})
