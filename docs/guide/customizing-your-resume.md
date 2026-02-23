# Customizing Your Resume

Resumx handles layout automatically, so most resumes need nothing beyond a theme and a page target. When you do want more control, customization is progressive, from style variables to Tailwind classes to fully custom CSS.

## 1. Fit to Page

Set a target page count and Resumx adjusts spacing, margins, and font size to fit. A small overflow tightens gaps; only a severe one touches your font size.

```markdown
---
pages: 1
---
```

No manual tuning needed in most cases. See [Fit to Page](/guide/fit-to-page) for the full details.

## 2. Pick a Theme

Choose one or more built-in themes in your frontmatter. Your content stays the same, only the presentation changes. Resumx generates a separate PDF for each theme.

```markdown
---
themes: [zurich, oxford, seattle]
---

# Jane Doe

<!-- ... -->
```

See [Themes](/guide/themes) for all options.

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

See [Themes > CSS Variables](/guide/themes#css-variables) for the full list.

## 4. Style in Markdown

Apply [Tailwind CSS](/guide/tailwind-css) classes to individual elements for quick one-off styling:

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

## 5. Create a Custom Theme

When you need complete control, create a CSS file with your own imports and variables:

```css
/* my-theme.css */
@import 'common/base.css';
@import 'common/icons.css';

:root {
	--font-family: 'Inter', sans-serif;
	--accent-color: #2563eb;
}
```

Then reference it by path in your frontmatter (`themes: my-theme.css`) or on the command line (`--theme my-theme.css`).

See [Custom CSS](/guide/custom-css) for the full guide.
