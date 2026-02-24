# Customizing Your Resume

Resumx handles layout automatically, so most resumes need nothing beyond a page target. When you do want more control, customization is progressive, from style options to Tailwind classes to fully custom CSS.

## 1. Fit to Page

Set a target page count and Resumx adjusts spacing, margins, and font size to fit. A small overflow tightens gaps, only a severe one touches your font size.

```markdown
---
pages: 1
---
```

No manual tuning needed in most cases. See [Fit to Page](/guide/fit-to-page) for the full details.

## 2. Style Options

Need to adjust a font, color, or spacing? Override a style property via `style:` in frontmatter.

```markdown
---
pages: 1
style:
  font-family: 'Inter, sans-serif'
  font-size: 10pt
  page-margin-x: 0.4in
  name-caps: small-caps
---
```

See [Style Options](/guide/style-options#options-reference) for the full list.

## 3. Tailwind CSS

Apply [Tailwind CSS](/guide/tailwind-css) classes to individual elements for quick one-off styling:

```markdown
[React]{.bg-blue-100 .text-blue-800 .px-2 .rounded}
```

## 4. Custom CSS File

When you need complete control, create a CSS file. It cascades on top of the default stylesheet, so you only write overrides:

```css
/* my-styles.css */
:root {
	--font-family: 'Inter', sans-serif;
	--accent-color: #2563eb;
}

h2 {
	letter-spacing: 0.05em;
}
```

Reference it in frontmatter (`css: my-styles.css`) or on the command line (`--css my-styles.css`).

You can also add a `<style>` block directly in your Markdown for quick one-off tweaks:

```html
<style>
	a {
		color: #2563eb;
	}
</style>
```

See [Custom CSS](/guide/custom-css) for the full guide.
