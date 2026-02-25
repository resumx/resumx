# Classes & IDs

Add classes, IDs, and HTML attributes to any Markdown element using curly-brace `{...}` syntax.

## Bracketed Spans

Wrap inline text in `[text]{...}` to produce a `<span>` with the given classes, IDs, or attributes:

| Markdown               | HTML                                    |
| ---------------------- | --------------------------------------- |
| `[text]{.right}`       | `<span class="right">text</span>`       |
| `[text]{#my-id}`       | `<span id="my-id">text</span>`          |
| `[text]{data-x="val"}` | `<span data-x="val">text</span>`        |
| `[text]{.a .b #id}`    | `<span class="a b" id="id">text</span>` |

This is the most common syntax in Resumx — used for applying [Tailwind CSS](/guide/tailwind-css) classes, tagging content for [tailored variants](/guide/tailored-variants), and more:

```markdown
### Google [2022 – Present]{.right}

_Senior Software Engineer_ [San Francisco, CA]{.right}
```

## Element Attributes

When `{...}` appears at the end of a block element without `[...]`, it applies to the whole element instead of wrapping text in a span:

```markdown
## Experience

### Google {.small-caps}

- Designed REST APIs with OpenAPI documentation {.@backend}
- Built interactive dashboards with React and D3.js {.@frontend}
- Led team of 5 engineers to deliver project 2 weeks early
```

## Fenced Divs

Use `:::` to apply attributes to block content. With a single child, attributes apply directly to it:

<!-- prettier-ignore-start -->
:::: code-group
```markdown [Markdown]
## Technical Skills

::: {.grid .grid-cols-3}
- JavaScript
- TypeScript
- Python
- React
- Node.js
- PostgreSQL
:::
```

```html [HTML]
<h2>Technical Skills</h2>

<ul class="grid grid-cols-3">
	<li>JavaScript</li>
	<li>TypeScript</li>
	<li>Python</li>
	<li>React</li>
	<li>Node.js</li>
	<li>PostgreSQL</li>
</ul>
```
::::
<!-- prettier-ignore-end -->

![Fenced div with unnamed form](/images/grid-bullet-with-fence.png)

No wrapper `<div>` is emitted. This is the primary way to style block elements like lists, blockquotes, and tables without adding extra nesting.

If the fenced div contains multiple children, it auto-promotes to a `<div>` wrapper with the attributes:

<!-- prettier-ignore-start -->
:::: code-group
```markdown [Markdown]
::: {.flex .gap-4}
## Title

Some paragraph
:::
```

```html [HTML]
<div class="flex gap-4">
	<h2>Title</h2>

	<p>Some paragraph</p>
</div>
```

::::
<!-- prettier-ignore-end -->

You can also prefix a tag name (e.g., `::: footer {.text-center}`) to emit a specific HTML element instead of `<div>`.
