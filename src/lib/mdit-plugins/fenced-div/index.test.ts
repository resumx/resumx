import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { fencedDiv } from './index.js'

describe('fencedDiv plugin', () => {
	function createMd() {
		return new MarkdownIt().use(fencedDiv)
	}

	/**
	 * Helper to normalize HTML for comparison:
	 * - Trims leading/trailing whitespace
	 * - Normalizes multiple newlines to single newline
	 */
	function normalizeHtml(html: string): string {
		return html.trim().replace(/\n+/g, '\n')
	}

	describe('basic fenced div syntax', () => {
		it('renders ::: div {.class} ... ::: as div with class', () => {
			const md = createMd()
			const result = md.render('::: div {.highlight}\nContent here\n:::')
			expect(normalizeHtml(result)).toBe(
				'<div class="highlight">\n<p>Content here</p>\n</div>',
			)
		})

		it('renders multiple classes in order', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.class1 .class2 .class3}\nContent\n:::',
			)
			expect(normalizeHtml(result)).toBe(
				'<div class="class1 class2 class3">\n<p>Content</p>\n</div>',
			)
		})

		it('renders id attribute', () => {
			const md = createMd()
			const result = md.render('::: div {#my-id}\nContent\n:::')
			expect(normalizeHtml(result)).toBe(
				'<div id="my-id">\n<p>Content</p>\n</div>',
			)
		})

		it('renders mixed attributes with correct order (class before id before custom)', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.highlight #section data-test="value"}\nContent\n:::',
			)
			expect(result).toMatch(
				/<div class="highlight" id="section" data-test="value">/,
			)
			expect(normalizeHtml(result)).toBe(
				'<div class="highlight" id="section" data-test="value">\n<p>Content</p>\n</div>',
			)
		})

		it('renders multiple custom attributes', () => {
			const md = createMd()
			const result = md.render(
				'::: div {data-x="1" data-y="2" aria-label="test"}\nContent\n:::',
			)
			const divMatch = result.match(/<div([^>]*)>/)
			expect(divMatch).not.toBeNull()
			const attrs = divMatch![1]
			expect(attrs).toContain(' data-x="1"')
			expect(attrs).toContain(' data-y="2"')
			expect(attrs).toContain(' aria-label="test"')
			expect(attrs.trim()).not.toMatch(/^class=/)
			expect(attrs.trim()).not.toMatch(/^id=/)
		})
	})

	describe('role namespace classes', () => {
		it('renders role:frontend class exactly', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.role:frontend}\n- Item 1\n- Item 2\n:::',
			)
			expect(result).toMatch(/<div class="role:frontend">/)
			expect(result).toMatch(/<ul>\n<li>Item 1<\/li>\n<li>Item 2<\/li>\n<\/ul>/)
		})

		it('renders multiple role classes preserving order', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.role:frontend .role:fullstack .role:backend}\nContent\n:::',
			)
			expect(result).toMatch(
				/<div class="role:frontend role:fullstack role:backend">/,
			)
		})

		it('renders mixed role and regular classes', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.highlight .role:frontend .warning}\nContent\n:::',
			)
			expect(result).toMatch(/<div class="highlight role:frontend warning">/)
		})
	})

	describe('component name as HTML tag', () => {
		it('renders unbraced word as custom element tag', () => {
			const md = createMd()
			const result = md.render('::: callout\nContent\n:::')
			expect(normalizeHtml(result)).toBe(
				'<callout>\n<p>Content</p>\n</callout>',
			)
		})

		it('renders component tag with additional classes from attributes', () => {
			const md = createMd()
			const result = md.render('::: callout {.warning .urgent}\nContent\n:::')
			expect(result).toMatch(/<callout class="warning urgent">/)
			expect(result).toMatch(/<\/callout>/)
		})

		it('renders component tag with id and classes', () => {
			const md = createMd()
			const result = md.render(
				'::: sidebar {.role:frontend #nav}\nContent\n:::',
			)
			expect(result).toMatch(/<sidebar class="role:frontend" id="nav">/)
			expect(result).toMatch(/<\/sidebar>/)
		})

		it('handles hyphenated component names as tags', () => {
			const md = createMd()
			const result = md.render('::: my-component\nContent\n:::')
			expect(result).toMatch(/<my-component>/)
			expect(result).toMatch(/<\/my-component>/)
		})

		it('handles underscored component names as tags', () => {
			const md = createMd()
			const result = md.render('::: my_component\nContent\n:::')
			expect(result).toMatch(/<my_component>/)
			expect(result).toMatch(/<\/my_component>/)
		})

		it('unnamed fenced div with single child forwards attrs (no wrapper)', () => {
			const md = createMd()
			const result = md.render('::: {.highlight}\nContent\n:::')
			expect(result).toMatch(/<p class="highlight">Content<\/p>/)
			expect(result).not.toMatch(/<div/)
		})
	})

	describe('trailing colons after attributes (Pandoc style)', () => {
		it('allows trailing colons after component name', () => {
			const md = createMd()
			const result = md.render('::: Warning ::::::\nContent\n:::')
			expect(result).toMatch(/<Warning>/)
			expect(result).toMatch(/<p>Content<\/p>/)
			expect(result).toMatch(/<\/Warning>/)
		})

		it('allows trailing colons after attribute block', () => {
			const md = createMd()
			const result = md.render(
				'::::: div {#special .sidebar} :::::\nContent\n:::',
			)
			expect(result).toMatch(/<div class="sidebar" id="special">/)
			expect(result).toMatch(/<\/div>/)
		})

		it('allows trailing colons after component name with attributes', () => {
			const md = createMd()
			const result = md.render('::: callout {.warning} ::::\nContent\n:::')
			expect(result).toMatch(/<callout class="warning">/)
			expect(result).toMatch(/<\/callout>/)
		})

		it('handles many trailing colons', () => {
			const md = createMd()
			const result = md.render(
				'::: Warning ::::::::::::::::\nContent\n::::::::::::::::::',
			)
			expect(result).toMatch(/<Warning>/)
			expect(result).toMatch(/<\/Warning>/)
		})
	})

	describe('markdown content preservation', () => {
		it('renders inline markdown correctly', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.highlight}\n**Bold**, *italic*, and `code`\n:::',
			)
			expect(result).toMatch(/<strong>Bold<\/strong>/)
			expect(result).toMatch(/<em>italic<\/em>/)
			expect(result).toMatch(/<code>code<\/code>/)
		})

		it('renders unordered lists correctly', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.list}\n- Item 1\n- Item 2\n- Item 3\n:::',
			)
			const expected = `<div class="list">
<ul>
<li>Item 1</li>
<li>Item 2</li>
<li>Item 3</li>
</ul>
</div>`
			expect(normalizeHtml(result)).toBe(expected)
		})

		it('renders ordered lists correctly', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.steps}\n1. First\n2. Second\n3. Third\n:::',
			)
			expect(result).toMatch(/<ol>/)
			expect(result).toMatch(/<li>First<\/li>/)
			expect(result).toMatch(/<li>Second<\/li>/)
			expect(result).toMatch(/<li>Third<\/li>/)
			expect(result).toMatch(/<\/ol>/)
		})

		it('renders headings inside the div', () => {
			const md = createMd()
			const result = md.render('::: div {.section}\n## Heading\nParagraph\n:::')
			expect(normalizeHtml(result)).toBe(
				'<div class="section">\n<h2>Heading</h2>\n<p>Paragraph</p>\n</div>',
			)
		})

		it('renders code blocks inside the div', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.example}\n```javascript\nconst x = 1;\n```\n:::',
			)
			expect(result).toMatch(/<div class="example">/)
			expect(result).toMatch(/<pre><code class="language-javascript">/)
			expect(result).toMatch(/const x = 1;/)
		})

		it('renders blockquotes inside the div', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.quote}\n> Quoted text\n> More quote\n:::',
			)
			expect(result).toMatch(/<blockquote>/)
			expect(result).toMatch(/Quoted text/)
		})

		it('renders links correctly', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.links}\n[Link text](https://example.com)\n:::',
			)
			expect(result).toMatch(/<a href="https:\/\/example.com">Link text<\/a>/)
		})

		it('renders images correctly', () => {
			const md = createMd()
			const result = md.render('::: div {.media}\n![Alt text](image.png)\n:::')
			expect(result).toMatch(/<img src="image.png" alt="Alt text"/)
		})
	})

	describe('nested fenced divs', () => {
		it('renders single level nesting', () => {
			const md = createMd()
			const result = md.render(
				'::: div {.outer}\n::: div {.inner}\nNested content\n:::\n:::',
			)
			expect(result).toMatch(/<div class="outer">/)
			expect(result).toMatch(/<div class="inner">/)
			expect(result).toMatch(/<p>Nested content<\/p>/)
			expect(result.indexOf('</div>')).toBeLessThan(
				result.lastIndexOf('</div>'),
			)
		})

		it('renders deep nesting (3 levels)', () => {
			const md = createMd()
			const input = `::: div {.level1}
::: div {.level2}
::: div {.level3}
Deep content
:::
:::
:::`
			const result = md.render(input)
			expect(result).toMatch(/<div class="level1">/)
			expect(result).toMatch(/<div class="level2">/)
			expect(result).toMatch(/<div class="level3">/)
			expect(result).toMatch(/<p>Deep content<\/p>/)
			expect((result.match(/<\/div>/g) || []).length).toBe(3)
		})

		it('renders sibling nested divs', () => {
			const md = createMd()
			const input = `::: div {.parent}
::: div {.child1}
First child
:::
::: div {.child2}
Second child
:::
:::`
			const result = md.render(input)
			expect(result).toMatch(/<div class="parent">/)
			expect(result).toMatch(/<div class="child1">/)
			expect(result).toMatch(/<div class="child2">/)
			expect(result).toMatch(/<p>First child<\/p>/)
			expect(result).toMatch(/<p>Second child<\/p>/)
		})

		it('renders nested divs with different marker lengths', () => {
			const md = createMd()
			const input = `:::: div {.outer}
::: div {.inner}
Content
:::
::::`
			const result = md.render(input)
			expect(result).toMatch(/<div class="outer">/)
			expect(result).toMatch(/<div class="inner">/)
		})

		it('closing fence does not need to match opening fence count (Pandoc behavior)', () => {
			const md = createMd()
			const input = `::::: div {.class}
Content
:::`
			const result = md.render(input)
			expect(result).toMatch(/<div class="class">/)
			expect(result).toMatch(/<p>Content<\/p>/)
			expect(result).toMatch(/<\/div>/)
			expect((result.match(/<div[^>]*>/g) || []).length).toBe(1)
		})

		it('fence without attributes is always a closer (Pandoc behavior)', () => {
			const md = createMd()
			const input = `::: Warning ::::::
This is a warning.

::: Danger
This is a warning within a warning.
:::
::::::::::::::::::`
			const result = md.render(input)
			expect(result).toMatch(/<Warning>/)
			expect(result).toMatch(/<Danger>/)
			expect(result).toMatch(/<\/Danger>/)
			expect(result).toMatch(/<\/Warning>/)
		})

		it('renders nested component tags correctly', () => {
			const md = createMd()
			const input = `:::: outer
::: inner
Content
:::
::::`
			const result = md.render(input)
			expect(result).toMatch(/<outer>/)
			expect(result).toMatch(/<inner>/)
			expect(result).toMatch(/<\/inner>/)
			expect(result).toMatch(/<\/outer>/)
		})
	})

	describe('whitespace and linebreak preservation', () => {
		it('preserves single linebreak between paragraphs', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\nPara 1\n\nPara 2\n:::')
			expect(result).toMatch(/<p>Para 1<\/p>/)
			expect(result).toMatch(/<p>Para 2<\/p>/)
		})

		it('handles multiple blank lines between content', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\nPara 1\n\n\n\nPara 2\n:::')
			expect(result).toMatch(/<p>Para 1<\/p>/)
			expect(result).toMatch(/<p>Para 2<\/p>/)
		})

		it('handles blank line after opening fence', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\n\nContent after blank\n:::')
			expect(result).toMatch(/<div class="box">/)
			expect(result).toMatch(/<p>Content after blank<\/p>/)
		})

		it('handles blank line before closing fence', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\nContent\n\n:::')
			expect(result).toMatch(/<p>Content<\/p>/)
			expect(result).toMatch(/<\/div>/)
		})

		it('handles extra spaces around opening fence attributes', () => {
			const md = createMd()
			const result = md.render(':::   div {.class}   \nContent\n:::')
			expect(result).toMatch(/<div class="class">/)
		})

		it('handles tabs in content', () => {
			const md = createMd()
			const result = md.render('::: div {.code}\n\tTabbed line\n:::')
			expect(result).toMatch(/Tabbed line/)
		})

		it('preserves indentation in code blocks inside div', () => {
			const md = createMd()
			const input = `::: div {.example}
\`\`\`python
def foo():
    return bar
\`\`\`
:::`
			const result = md.render(input)
			expect(result).toMatch(/def foo\(\):/)
			expect(result).toMatch(/    return bar/)
		})

		it('handles content starting immediately after opening fence', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\nFirst line\n:::')
			expect(result).toMatch(/<div class="box">/)
			expect(result).toMatch(/<p>First line<\/p>/)
		})
	})

	describe('edge cases and boundary conditions', () => {
		it('auto-closes unclosed named fenced div at EOF', () => {
			const md = createMd()
			const result = md.render('::: div {.class}\nContent without closing')
			expect(result).toMatch(/<div class="class">/)
			expect(result).toMatch(/<p>Content without closing<\/p>/)
			expect(result).toMatch(/<\/div>/)
		})

		it('handles empty named fenced div', () => {
			const md = createMd()
			const result = md.render('::: div {.empty}\n:::')
			expect(result.trim()).toBe('<div class="empty"></div>')
		})

		it('handles named fenced div with only whitespace content', () => {
			const md = createMd()
			const result = md.render('::: div {.whitespace}\n   \n\n   \n:::')
			expect(result).toMatch(/<div class="whitespace">/)
			expect(result).toMatch(/<\/div>/)
		})

		it('unnamed ::: without attributes is transparent (no output)', () => {
			const md = createMd()
			const result = md.render(':::\nContent\n:::')
			expect(result).not.toMatch(/<div/)
			expect(result).toMatch(/<p>Content<\/p>/)
		})

		it('does not match ::: in the middle of a line', () => {
			const md = createMd()
			const result = md.render('Some text ::: {.class}\nMore text')
			expect(result).not.toMatch(/<div/)
			expect(result).toMatch(/<p>Some text ::: \{\.class\}/)
		})

		it('does not match ::: with only 2 colons', () => {
			const md = createMd()
			const result = md.render(':: {.class}\nContent\n::')
			expect(result).not.toMatch(/<div/)
		})

		it('handles more than 3 colons with named div', () => {
			const md = createMd()
			const result = md.render(':::: div {.class}\nContent\n::::')
			expect(result).toMatch(/<div class="class">/)
			expect(result).toMatch(/<p>Content<\/p>/)
		})

		it('handles 5 colons with named div', () => {
			const md = createMd()
			const result = md.render('::::: div {.class}\nContent\n:::::')
			expect(result).toMatch(/<div class="class">/)
		})

		it('closing fence with fewer colons still closes (Pandoc behavior)', () => {
			const md = createMd()
			const result = md.render(':::: div {.class}\nContent\n:::')
			expect(result).toMatch(/<div class="class">/)
			expect(result).toMatch(/<p>Content<\/p>/)
			expect(result).toMatch(/<\/div>/)
			expect((result.match(/<div[^>]*>/g) || []).length).toBe(1)
			expect((result.match(/<\/div>/g) || []).length).toBe(1)
		})

		it('handles multiple named fenced divs in sequence', () => {
			const md = createMd()
			const input = `::: div {.first}
First content
:::

::: div {.second}
Second content
:::`
			const result = md.render(input)
			expect(result).toMatch(/<div class="first">/)
			expect(result).toMatch(/<div class="second">/)
			expect(result).toMatch(/<p>First content<\/p>/)
			expect(result).toMatch(/<p>Second content<\/p>/)
			expect((result.match(/<\/div>/g) || []).length).toBe(2)
		})

		it('handles immediately adjacent named fenced divs', () => {
			const md = createMd()
			const input = `::: div {.first}
First
:::
::: div {.second}
Second
:::`
			const result = md.render(input)
			expect(result).toMatch(/<div class="first">/)
			expect(result).toMatch(/<div class="second">/)
		})
	})

	describe('attribute parsing edge cases', () => {
		it('handles single-quoted attribute values', () => {
			const md = createMd()
			const result = md.render("::: div {data-value='single'}\nContent\n:::")
			expect(result).toMatch(/<div data-value="single">/)
		})

		it('handles unquoted attribute values', () => {
			const md = createMd()
			const result = md.render('::: div {data-value=unquoted}\nContent\n:::')
			expect(result).toMatch(/<div data-value="unquoted">/)
		})

		it('handles class with special characters (colon)', () => {
			const md = createMd()
			const result = md.render('::: div {.ns:class}\nContent\n:::')
			expect(result).toMatch(/<div class="ns:class">/)
		})

		it('handles class with numbers', () => {
			const md = createMd()
			const result = md.render('::: div {.class123}\nContent\n:::')
			expect(result).toMatch(/<div class="class123">/)
		})

		it('handles id with hyphen', () => {
			const md = createMd()
			const result = md.render('::: div {#my-long-id}\nContent\n:::')
			expect(result).toMatch(/<div id="my-long-id">/)
		})

		it('handles empty attribute block', () => {
			const md = createMd()
			const result = md.render('::: div {}\nContent\n:::')
			expect(result).toMatch(/<div>/)
		})

		it('handles attribute block with only whitespace', () => {
			const md = createMd()
			const result = md.render('::: div {   }\nContent\n:::')
			expect(result).toMatch(/<div>/)
		})

		it('ignores duplicate classes (keeps all)', () => {
			const md = createMd()
			const result = md.render('::: div {.dup .dup .dup}\nContent\n:::')
			expect(result).toMatch(/<div class="dup dup dup">/)
		})

		it('handles both id and classes', () => {
			const md = createMd()
			const result = md.render('::: div {#myid .class1 .class2}\nContent\n:::')
			expect(result).toMatch(/<div class="class1 class2" id="myid">/)
		})
	})

	describe('escaping and special content', () => {
		it('handles HTML entities in content', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\n&amp; &lt; &gt;\n:::')
			expect(result).toMatch(/&amp;/)
			expect(result).toMatch(/&lt;/)
			expect(result).toMatch(/&gt;/)
		})

		it('escapes raw < and > in content', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\nif (a < b && c > d)\n:::')
			expect(result).toMatch(/&lt;/)
			expect(result).toMatch(/&gt;/)
		})

		it('handles ::: inside code block (not parsed as fence)', () => {
			const md = createMd()
			const input = `::: div {.outer}
\`\`\`
::: {.inner}
This is not a div
:::
\`\`\`
:::`
			const result = md.render(input)
			expect(result).toMatch(/<div class="outer">/)
			expect(result).toMatch(/::: \{\.inner\}/)
			expect((result.match(/<div[^>]*>/g) || []).length).toBe(1)
		})

		it('handles ::: inside inline code', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\nUse `:::` for fenced divs\n:::')
			expect(result).toMatch(/<code>:::<\/code>/)
		})

		it('handles backslash in content', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\nPath: C:\\Users\\test\n:::')
			expect(result).toMatch(/C:\\Users\\test/)
		})

		it('handles curly braces in content', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\n{ key: "value" }\n:::')
			expect(result).toMatch(/\{ key: &quot;value&quot; \}/)
		})

		it('handles markdown special chars that should not be parsed', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\n\\*not italic\\*\n:::')
			expect(result).toMatch(/\*not italic\*/)
			expect(result).not.toMatch(/<em>/)
		})
	})

	describe('interaction with other markdown features', () => {
		it('handles horizontal rule inside div', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\nBefore\n\n---\n\nAfter\n:::')
			expect(result).toMatch(/<hr/)
		})

		it('handles table inside div', () => {
			const md = createMd()
			const input = `::: div {.table-wrapper}
| Col1 | Col2 |
|------|------|
| A    | B    |
:::`
			const result = md.render(input)
			expect(result).toMatch(/<table>/)
			expect(result).toMatch(/<th>Col1<\/th>/)
		})

		it('handles definition list behavior (standard md)', () => {
			const md = createMd()
			const input = `::: div {.definitions}
Term 1
: Definition 1

Term 2
: Definition 2
:::`
			const result = md.render(input)
			expect(result).toMatch(/Term 1/)
			expect(result).toMatch(/Definition 1/)
		})

		it('content before named fenced div is separate', () => {
			const md = createMd()
			const result = md.render('Before content\n\n::: div {.box}\nInside\n:::')
			expect(result).toMatch(/<p>Before content<\/p>/)
			expect(result).toMatch(/<div class="box">/)
			expect(result.indexOf('<p>Before content</p>')).toBeLessThan(
				result.indexOf('<div class="box">'),
			)
		})

		it('content after named fenced div is separate', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\nInside\n:::\n\nAfter content')
			expect(result).toMatch(/<\/div>/)
			expect(result).toMatch(/<p>After content<\/p>/)
			expect(result.indexOf('</div>')).toBeLessThan(
				result.indexOf('<p>After content</p>'),
			)
		})
	})

	describe('invalid syntax handling', () => {
		it('ignores malformed attribute block (no closing brace)', () => {
			const md = createMd()
			const result = md.render('::: {.class\nContent\n:::')
			expect(result).not.toMatch(/<div class="class">/)
		})

		it('passes through invalid characters in class names (no sanitization)', () => {
			const md = createMd()
			const result = md.render('::: div {.class!@#}\nContent\n:::')
			expect(result).toMatch(/<div class="class!@">/)
		})

		it('handles missing closing fence gracefully (named)', () => {
			const md = createMd()
			const result = md.render('::: div {.open}\nLine 1\nLine 2\nLine 3')
			expect(result).toMatch(/<div class="open">/)
			expect(result).toMatch(/<\/div>/)
			expect(result).toMatch(/Line 1/)
			expect(result).toMatch(/Line 2/)
			expect(result).toMatch(/Line 3/)
		})

		it('handles closing fence with extra content after', () => {
			const md = createMd()
			const result = md.render('::: div {.box}\nContent\n::: extra')
			expect(result).toMatch(/extra/)
		})
	})

	describe('arbitrary colon counts', () => {
		it('handles 3 colons (minimum)', () => {
			const md = createMd()
			const result = md.render('::: div {.class}\nContent\n:::')
			expect(result).toMatch(/<div class="class">/)
			expect(result).toMatch(/<\/div>/)
		})

		it('handles 4 colons', () => {
			const md = createMd()
			const result = md.render(':::: div {.class}\nContent\n::::')
			expect(result).toMatch(/<div class="class">/)
		})

		it('handles 10 colons', () => {
			const md = createMd()
			const result = md.render(':::::::::: div {.class}\nContent\n::::::::::')
			expect(result).toMatch(/<div class="class">/)
		})

		it('handles 20 colons', () => {
			const md = createMd()
			const result = md.render(
				':::::::::::::::::::: warning\nContent\n::::::::::::::::::::',
			)
			expect(result).toMatch(/<warning>/)
			expect(result).toMatch(/<\/warning>/)
		})

		it('mismatched colon counts still work (Pandoc behavior)', () => {
			const md = createMd()
			const result = md.render(':::::::::: div {.class}\nContent\n:::')
			expect(result).toMatch(/<div class="class">/)
			expect(result).toMatch(/<\/div>/)
		})
	})

	describe('Pandoc-style syntax edge cases', () => {
		it('plain ::: without attributes is transparent', () => {
			const md = createMd()
			const result = md.render(':::\nContent\n:::')
			expect(result).not.toMatch(/<div/)
			expect(result).toMatch(/<p>Content<\/p>/)
		})

		it('opening fence requires attributes to be an opener', () => {
			const md = createMd()
			const result = md.render(':::\n::: {.inner}\nContent\n:::\n:::')
			expect(result).toBeDefined()
		})

		it('trailing colons must be separated by whitespace', () => {
			const md = createMd()
			const result = md.render('::: warning:::::\nContent\n:::')
			expect(result).toBeDefined()
		})

		it('handles empty trailing colons with whitespace', () => {
			const md = createMd()
			const result = md.render('::: warning   ::::::   \nContent\n:::')
			expect(result).toMatch(/<warning>/)
			expect(result).toMatch(/<\/warning>/)
		})

		it('complex nested Pandoc example with named div', () => {
			const md = createMd()
			const input = `::::: div {#special .sidebar}
Here is a paragraph.

And another.
:::::`
			const result = md.render(input)
			expect(result).toMatch(/<div class="sidebar" id="special">/)
			expect(result).toMatch(/<p>Here is a paragraph.<\/p>/)
			expect(result).toMatch(/<p>And another.<\/p>/)
			expect(result).toMatch(/<\/div>/)
		})
	})

	describe('complex real-world scenarios', () => {
		it('renders resume-style role-based sections with named div', () => {
			const md = createMd()
			const input = `::: div {.role:frontend .role:fullstack}
- Built React components with TypeScript
- Implemented responsive design
- Optimized bundle size by 40%
:::`
			const result = md.render(input)
			expect(result).toMatch(/<div class="role:frontend role:fullstack">/)
			expect(result).toMatch(/<ul>/)
			expect(result).toMatch(/Built React components/)
			expect(result).toMatch(/Optimized bundle size/)
		})

		it('renders callout with warning style as custom element', () => {
			const md = createMd()
			const input = `::: callout {.warning #important-note}
**Warning:** This action cannot be undone.

Please review carefully before proceeding.
:::`
			const result = md.render(input)
			expect(result).toMatch(/<callout class="warning" id="important-note">/)
			expect(result).toMatch(/<strong>Warning:<\/strong>/)
			expect(result).toMatch(/<\/callout>/)
		})

		it('renders complex nested layout', () => {
			const md = createMd()
			const input = `::: div {.container}
## Section Title

::: div {.row}
::: div {.col}
Left column content
:::
::: div {.col}
Right column content
:::
:::

Footer text
:::`
			const result = md.render(input)
			expect(result).toMatch(/<div class="container">/)
			expect(result).toMatch(/<h2>Section Title<\/h2>/)
			expect(result).toMatch(/<div class="row">/)
			expect((result.match(/<div class="col">/g) || []).length).toBe(2)
			expect(result).toMatch(/Left column content/)
			expect(result).toMatch(/Right column content/)
			expect(result).toMatch(/Footer text/)
		})
	})

	describe('attribute fallthrough (unnamed fenced divs)', () => {
		describe('single child: attrs forwarded to child element', () => {
			it('forwards class to a paragraph child', () => {
				const md = createMd()
				const result = md.render('::: {.text-sm}\nContent here\n:::')
				expect(normalizeHtml(result)).toBe(
					'<p class="text-sm">Content here</p>',
				)
			})

			it('forwards class to an unordered list child', () => {
				const md = createMd()
				const result = md.render(
					'::: {.grid .grid-cols-3}\n- JavaScript\n- TypeScript\n- Python\n:::',
				)
				expect(result).toMatch(/<ul class="grid grid-cols-3">/)
				expect(result).not.toMatch(/<div/)
			})

			it('forwards class to an ordered list child', () => {
				const md = createMd()
				const result = md.render(
					'::: {.list-decimal}\n1. First\n2. Second\n:::',
				)
				expect(result).toMatch(/<ol class="list-decimal">/)
				expect(result).not.toMatch(/<div/)
			})

			it('forwards class to a blockquote child', () => {
				const md = createMd()
				const result = md.render(
					'::: {.border-l-2 .italic}\n> Quoted text\n:::',
				)
				expect(result).toMatch(/<blockquote class="border-l-2 italic">/)
				expect(result).not.toMatch(/<div/)
			})

			it('forwards class to a table child', () => {
				const md = createMd()
				const input = `::: {.table-auto .text-sm}
| Col1 | Col2 |
|------|------|
| A    | B    |
:::`
				const result = md.render(input)
				expect(result).toMatch(/<table class="table-auto text-sm">/)
				expect(result).not.toMatch(/<div/)
			})

			it('forwards class to a heading child', () => {
				const md = createMd()
				const result = md.render('::: {.text-lg}\n## My Heading\n:::')
				expect(result).toMatch(/<h2 class="text-lg">/)
				expect(result).not.toMatch(/<div/)
			})

			it('forwards id attribute to child', () => {
				const md = createMd()
				const result = md.render('::: {#skills}\n- JavaScript\n- Python\n:::')
				expect(result).toMatch(/<ul id="skills">/)
				expect(result).not.toMatch(/<div/)
			})

			it('forwards mixed attributes (class, id, data-*) to child', () => {
				const md = createMd()
				const result = md.render(
					'::: {.highlight #section data-test="value"}\nContent\n:::',
				)
				expect(result).toMatch(
					/<p class="highlight" id="section" data-test="value">/,
				)
				expect(result).not.toMatch(/<div/)
			})

			it('forwards role classes to single child', () => {
				const md = createMd()
				const result = md.render(
					'::: {.role:frontend}\n- Built React components\n- Implemented responsive design\n:::',
				)
				expect(result).toMatch(/<ul class="role:frontend">/)
				expect(result).not.toMatch(/<div/)
			})
		})

		describe('multiple children: auto-promote to div wrapper', () => {
			it('wraps two children (paragraph + list) in div with attrs', () => {
				const md = createMd()
				const result = md.render(
					'::: {.grid .grid-cols-3}\nIntro text\n\n- Item 1\n- Item 2\n:::',
				)
				expect(result).toMatch(/<div class="grid grid-cols-3">/)
				expect(result).toMatch(/<p>Intro text<\/p>/)
				expect(result).toMatch(/<ul>/)
				expect(result).toMatch(/<\/div>/)
			})

			it('wraps two paragraphs in div with attrs', () => {
				const md = createMd()
				const result = md.render(
					'::: {.text-sm}\nParagraph 1\n\nParagraph 2\n:::',
				)
				expect(result).toMatch(/<div class="text-sm">/)
				expect(result).toMatch(/<p>Paragraph 1<\/p>/)
				expect(result).toMatch(/<p>Paragraph 2<\/p>/)
				expect(result).toMatch(/<\/div>/)
			})

			it('wraps multiple children in plain div when no attrs', () => {
				const md = createMd()
				const result = md.render(':::\nParagraph 1\n\nParagraph 2\n:::')
				expect(result).toMatch(/<div>/)
				expect(result).toMatch(/<p>Paragraph 1<\/p>/)
				expect(result).toMatch(/<p>Paragraph 2<\/p>/)
				expect(result).toMatch(/<\/div>/)
			})
		})

		describe('empty unnamed fenced div: removed entirely', () => {
			it('produces no output for empty unnamed fenced div with attrs', () => {
				const md = createMd()
				const result = md.render('::: {.class}\n:::')
				expect(result.trim()).toBe('')
			})

			it('produces no output for empty unnamed fenced div without attrs', () => {
				const md = createMd()
				const result = md.render(':::\n:::')
				expect(result.trim()).toBe('')
			})
		})

		describe('named fenced divs: always create wrapper (unchanged)', () => {
			it('::: div creates a div wrapper', () => {
				const md = createMd()
				const result = md.render('::: div {.container}\nContent\n:::')
				expect(normalizeHtml(result)).toBe(
					'<div class="container">\n<p>Content</p>\n</div>',
				)
			})

			it('::: nav creates a nav wrapper', () => {
				const md = createMd()
				const result = md.render('::: nav {.main-nav}\nContent\n:::')
				expect(result).toMatch(/<nav class="main-nav">/)
				expect(result).toMatch(/<\/nav>/)
			})

			it('::: article creates an article wrapper', () => {
				const md = createMd()
				const result = md.render('::: article\nContent\n:::')
				expect(result).toMatch(/<article>/)
				expect(result).toMatch(/<\/article>/)
			})

			it('::: aside creates an aside wrapper', () => {
				const md = createMd()
				const result = md.render('::: aside {.sidebar}\nContent\n:::')
				expect(result).toMatch(/<aside class="sidebar">/)
				expect(result).toMatch(/<\/aside>/)
			})

			it('::: section creates a section wrapper', () => {
				const md = createMd()
				const result = md.render('::: section {.skills}\nContent\n:::')
				expect(result).toMatch(/<section class="skills">/)
				expect(result).toMatch(/<\/section>/)
			})

			it('::: div wraps multiple children', () => {
				const md = createMd()
				const result = md.render('::: div {.wrapper}\nPara 1\n\nPara 2\n:::')
				expect(result).toMatch(/<div class="wrapper">/)
				expect(result).toMatch(/<p>Para 1<\/p>/)
				expect(result).toMatch(/<p>Para 2<\/p>/)
				expect(result).toMatch(/<\/div>/)
			})
		})

		describe('nested unnamed fenced divs', () => {
			it('handles named outer with unnamed inner', () => {
				const md = createMd()
				const input = `::: div {.outer}
::: {.inner}
- Item 1
- Item 2
:::
:::`
				const result = md.render(input)
				expect(result).toMatch(/<div class="outer">/)
				expect(result).toMatch(/<ul class="inner">/)
				expect(result).toMatch(/<\/div>/)
			})
		})

		describe('attr merging (Vue-style fallthrough)', () => {
			it('appends classes from outer and inner onto child', () => {
				const md = createMd()
				const input = `::: {.outer-class}
::: {.inner-class}
Content
:::
:::`
				const result = md.render(input)
				expect(result).not.toMatch(/<div/)
				expect(result).toMatch(
					/<p class="inner-class outer-class">Content<\/p>/,
				)
			})

			it('outer id overrides inner id', () => {
				const md = createMd()
				const input = `::: {#outer-id}
::: {#inner-id}
Content
:::
:::`
				const result = md.render(input)
				expect(result).toMatch(/<p id="outer-id">Content<\/p>/)
			})

			it('outer custom attrs override inner custom attrs', () => {
				const md = createMd()
				const input = `::: {data-x="from-outer"}
::: {data-x="from-inner"}
Content
:::
:::`
				const result = md.render(input)
				expect(result).toMatch(/data-x="from-outer"/)
				expect(result).not.toMatch(/data-x="from-inner"/)
			})

			it('non-conflicting attrs from both layers are preserved', () => {
				const md = createMd()
				const input = `::: {data-a="outer"}
::: {data-b="inner"}
Content
:::
:::`
				const result = md.render(input)
				expect(result).toMatch(/data-a="outer"/)
				expect(result).toMatch(/data-b="inner"/)
			})

			it('merges classes while overriding id across three layers', () => {
				const md = createMd()
				const input = `::: {.a #outermost}
::: {.b #middle}
::: {.c #innermost}
Content
:::
:::
:::`
				const result = md.render(input)
				expect(result).toMatch(/class="c b a"/)
				expect(result).toMatch(/id="outermost"/)
			})

			it('merges style from outer and inner', () => {
				const md = createMd()
				const input = `::: {style="color:red"}
::: {style="font-weight:bold"}
Content
:::
:::`
				const result = md.render(input)
				expect(result).toMatch(/style="font-weight:bold; color:red"/)
			})

			it('single layer sets attrs without conflict', () => {
				const md = createMd()
				const input = `::: {.cls #myid data-v="val"}
Content
:::`
				const result = md.render(input)
				expect(result).toMatch(
					/<p class="cls" id="myid" data-v="val">Content<\/p>/,
				)
			})
		})
	})

	describe('unknown tag names', () => {
		it('still renders unknown tags as wrapper elements', () => {
			const md = createMd()
			const result = md.render('::: banana\nContent\n:::')
			expect(result).toMatch(/<banana>/)
			expect(result).toMatch(/<\/banana>/)
		})

		it('does not produce warnings in env (warnings moved to validator)', () => {
			const md = createMd()
			const env: { warnings?: Array<{ line: number; message: string }> } = {}
			md.render('::: banana\nContent\n:::', env)
			expect(env.warnings).toBeUndefined()
		})
	})
})
