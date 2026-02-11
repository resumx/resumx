# The Resumx Approach

Resumx is designed around a simple principle: **write once, customize progressively**. Write your resume once in Markdown, then progressively customize the appearance — from zero-config themes to fully custom CSS.

## 1. Write Your Content

Start with plain Markdown. Focus on what you want to say, not how it looks.

```markdown
# Jane Doe

jane@example.com | github.com/jane | linkedin.com/in/jane

## Experience

### Google [2022 - Present]{.right}

_Senior Software Engineer_

- Built distributed systems serving 1M requests/day
- Led team of 5 engineers to deliver project 2 weeks early
```

#### One source, multiple role-specific resumes

Tag any element with `{.role:name}` to include it only in that role's output. Untagged content is shared across all versions.

```markdown
- Designed REST APIs with OpenAPI documentation {.role:backend}
- Built interactive dashboards with React and D3.js {.role:frontend}
- Led team of 5 engineers to deliver project 2 weeks early
```

This generates `resume-frontend.pdf` and `resume-backend.pdf` — each with the shared bullet and only its matching tagged one. See [Per-Role Output](/per-role-output) for details.

## 2. Pick a Theme

Choose one or more built-in themes in your frontmatter. Your content stays the same — only the presentation changes. Resumx generates a separate PDF for each theme.

```markdown
---
themes: [zurich, oxford, seattle]
---

# Jane Doe

<!-- ... -->
```

See [Themes](/themes) for all options.

::: tip Stop here if you're happy
Most resumes look great with just steps 1 and 2. The following steps are optional — use them only when you want more control.
:::

## 3. Fine-tune the Design

Need to adjust a font, color, or spacing? Override a style property.

```markdown
---
themes: zurich
style:
  font-family: 'Inter, sans-serif'
  font-size: 10pt
  page-margin-x: 0.4in
  name-caps: small-caps
---
```

See [Themes > CSS Variables](/themes#css-variables) for the full list.

## 4. Style in Markdown

Apply [Tailwind CSS](/tailwind-css) classes to individual elements for quick one-off styling:

```markdown
[React]{.bg-blue-100 .text-blue-800 .px-2 .rounded}
```

For broader changes, add a `<style>` block directly in your Markdown:

```html
<style>
	h2 {
		letter-spacing: 0.05em;
	}
	a {
		color: #2563eb;
	}
</style>
```

## 5. Eject and Fully Customize

When you need complete control — or want different styling per theme — eject a built-in theme and edit the CSS directly:

```bash
resumx eject zurich    # Creates ./themes/zurich.css
```

The ejected file is yours to modify. You can also create entirely new themes from scratch.

See [Custom CSS](/custom-css) for the full guide.
