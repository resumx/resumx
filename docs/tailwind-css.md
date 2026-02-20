# Tailwind CSS

::: info New to Tailwind?
[Tailwind CSS](https://tailwindcss.com/) is a utility-first CSS framework — apply classes like `text-blue-800` or `px-2` directly to elements instead of writing custom CSS. See Tailwind's [Styling with utility classes](https://tailwindcss.com/docs/styling-with-utility-classes) to learn more.
:::

Resumx compiles [Tailwind CSS v4](https://tailwindcss.com/) on-the-fly. Apply classes to any element using the [Classes & IDs syntax](/classes-and-ids).

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

Wrap multiple elements in a styled container:

```markdown
::: div {.bg-gray-50 .p-4 .rounded-lg}

## Section Title

Content with a styled container
:::
```

### Layout

Combine fenced divs with Tailwind layout utilities. Child elements can use bracketed spans or attribute lists:

```markdown
::: div {.flex .gap-4}

## Title {.flex-1}

[Button]{.self-end}
:::
```

## Arbitrary Values

Use square brackets for one-off values outside the default theme:

```markdown
[Custom color]{.text-[#ff6600]}
[After arrow]{.after:content-['↗']}
```

## Built-in Utility Classes

In addition to Tailwind, Resumx provides a few utility classes of its own:

| Class         | Effect                                        |
| ------------- | --------------------------------------------- |
| `.small-caps` | Apply `font-variant-caps: small-caps`         |
| `.sr-only`    | Visually hidden, accessible to screen readers |
