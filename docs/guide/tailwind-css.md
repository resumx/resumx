# Tailwind CSS

::: info New to Tailwind?
[Tailwind CSS](https://tailwindcss.com/) is a utility-first CSS framework — apply classes like `text-blue-800` or `px-2` directly to elements instead of writing custom CSS. See Tailwind's [Styling with utility classes](https://tailwindcss.com/docs/styling-with-utility-classes) to learn more.
:::

Resumx compiles [Tailwind CSS v4](https://tailwindcss.com/) on-the-fly. Apply classes to any element using the [Attributes syntax](/guide/syntax#attributes).

## Using Tailwind in Markdown

### Inline Spans

```markdown
Built with [React]{.bg-blue-100 .text-blue-800 .px-2 .rounded}
[View Site](https://example.com){.text-blue-600 .after:content-['_↗']}
```

### Headings

```markdown
### Google {.text-gray-600 .font-normal}
```

### Block Content

Style a list or other single block element directly (no wrapper needed):

<!-- prettier-ignore-start -->
```markdown
::: {.grid .grid-cols-3 .gap-x-4 .list-none}
- JavaScript
- TypeScript
- Python
- React
- Node.js
- PostgreSQL
:::
```
<!-- prettier-ignore-end -->

Wrap multiple elements in a styled container:

<!-- prettier-ignore-start -->
```markdown
::: div {.bg-gray-50 .p-4 .rounded-lg}
## Section Title

Content with a styled container
:::
```
<!-- prettier-ignore-end -->

### Layout

Combine fenced divs with Tailwind layout utilities. Child elements can use bracketed spans or attribute lists:

<!-- prettier-ignore-start -->
```markdown
::: div {.flex .gap-4}
## Title {.flex-1}

[Button]{.self-end}
:::
```
<!-- prettier-ignore-end -->

## Arbitrary Values

Use square brackets for one-off values outside the default theme:

```markdown
[Custom color]{.text-[#ff6600]}
[After arrow]{.after:content-['↗']}
```

## Built-in Utility Classes

In addition to Tailwind, Resumx provides a few utility classes of its own:

| Class                | Effect                                        |
| -------------------- | --------------------------------------------- |
| `.small-caps`        | Apply `font-variant-caps: small-caps`         |
| `.sr-only`           | Visually hidden, accessible to screen readers |
| `.max-1` – `.max-16` | Hide children beyond the Nth                  |

### Capping Visible Children

The `max-N` classes hide all children of an element beyond the Nth. This is useful when composite tag views combine many tagged bullets and produce more content than fits well on the page.

Apply via an unnamed fenced div so the class falls through to the `<ul>` (single child):

<!-- prettier-ignore-start -->
```markdown
::: {.max-3}
- Most important bullet
- Second most important
- Third most important
- ...remaining bullets hidden beyond 3rd
:::
```
<!-- prettier-ignore-end -->

Order bullets from most important to least important within each entry, so the cap always keeps the strongest content visible.

## Inline Style Block

For styling beyond [Tailwind utility classes](/guide/tailwind-css) and [style options](/guide/style-options), you can write custom CSS directly.

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
	--section-title-color: #2563eb;
	--section-title-border: 2px solid var(--section-title-color);
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

| Module                 | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `common/base.css`      | Reset, typography, spacing, page layout               |
| `common/icons.css`     | Icon sizing and alignment                             |
| `common/utilities.css` | Utility classes (`.small-caps`, `.sr-only`, `.max-N`) |

To target specific sections, entries, and header fields, see [Semantic Selectors](/guide/semantic-selectors).
