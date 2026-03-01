# Custom CSS

For styling beyond [Tailwind utility classes](/guide/tailwind-css) and [style options](/guide/style-options), you can write custom CSS directly.

## Inline Style Block

Add a `<style>` tag in your Markdown for customizations without needing a separate file.

```markdown
# Jane Doe

<!-- ... -->

<style>
	h2 {
		letter-spacing: 0.05em;
	}
	section[data-section='skills'] dl {
		grid-template-columns: 1fr 1fr;
	}
</style>
```

Inline styles are applied alongside the default styles, they don't replace them.

## Custom CSS File

Your CSS cascades on top of the default stylesheet, so you only write overrides:

```css
/* my-styles.css */
:root {
	--font-family: 'Inter', sans-serif;
	--accent-color: #2563eb;
	--section-title-border: 2px solid var(--accent-color);
	--header-align: left;
}

h2 {
	letter-spacing: 0.05em;
}
```

Reference it in frontmatter or on the CLI:

```markdown
---
css: my-styles.css
---
```

```bash
resumx resume.md --css my-styles.css
```

You can pass multiple CSS files as an array. They are combined in order, later files take precedence:

```yaml
css: [base-company.css, role-specific.css]
```

### Bundled Common Modules

If you need to build a stylesheet from scratch, your CSS file can `@import` any of the bundled common modules. They resolve automatically regardless of where your CSS file lives.

| Module                 | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `common/base.css`      | Reset, typography, spacing, page layout     |
| `common/icons.css`     | Icon sizing and alignment                   |
| `common/utilities.css` | Utility classes (`.small-caps`, `.sr-only`) |

To target specific sections, entries, and header fields, see [Semantic Selectors](/guide/semantic-selectors).
