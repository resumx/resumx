# Custom CSS

For styling beyond [Tailwind utility classes](/tailwind-css) and [theme variables](/themes#css-variables), you can write custom CSS directly.

## Inline Style Block

Add a `<style>` tag in your Markdown for customizations without needing a separate file.

```html
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

## Ejecting a Theme

To fully customize a built-in theme, eject it to your local `./themes/` directory:

```bash
resumx eject zurich       # Copies zurich.css to ./themes/zurich.css
```

Once ejected, the local copy takes precedence.

## Creating a Theme

Create a new CSS file in `./themes/` and import the common base:

```css
/* themes/my-theme.css */
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

Then use it:

```bash
resumx resume.md --theme my-theme
```

### Common Base Modules

| Module                  | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `common/base.css`       | Reset, typography, spacing, page layout                |
| `common/icons.css`      | Icon sizing and alignment                              |
| `common/utilities.css`  | Utility classes (`.small-caps`, `.sr-only`)            |
| `common/two-column.css` | Two-column grid layout (omit to disable `---` columns) |

### Import Resolution

`@import` paths resolve first to your local `./themes/` directory, then fall back to the bundled themes. This means you can eject and override individual common files (e.g., just `common/base.css`) without ejecting the entire theme.

To target specific sections, entries, and header fields, see [Semantic Selectors](/semantic-selectors).
