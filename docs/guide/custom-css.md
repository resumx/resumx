# Custom CSS

For styling beyond [Tailwind utility classes](/guide/tailwind-css) and [theme variables](/guide/themes#css-variables), you can write custom CSS directly.

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

Inline styles are applied alongside your theme — they don't replace it.

## Creating a Theme

Create a CSS file and import the common base modules:

```css
/* my-theme.css */
@import 'common/base.css';
@import 'common/icons.css';
@import 'common/utilities.css';
@import 'common/two-column.css';

:root {
	--font-family: 'Inter', sans-serif;
	--accent-color: #2563eb;
	--section-border: 2px solid var(--accent-color);
	--header-text-align: left;
}
```

Then reference it by path:

```markdown
---
themes: my-theme.css
---
```

```shell
resumx resume.md --theme my-theme.css
```

### Common Base Modules

Your theme can `@import` any of the bundled common modules. They resolve automatically regardless of where your CSS file lives.

| Module                  | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `common/base.css`       | Reset, typography, spacing, page layout                |
| `common/icons.css`      | Icon sizing and alignment                              |
| `common/utilities.css`  | Utility classes (`.small-caps`, `.sr-only`)            |
| `common/two-column.css` | Two-column grid layout (omit to disable `---` columns) |

To target specific sections, entries, and header fields, see [Semantic Selectors](/guide/semantic-selectors).
