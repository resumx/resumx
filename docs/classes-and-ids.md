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

This is the most common syntax in Resumx — used for applying [Tailwind CSS](/tailwind-css) classes, tagging content for [per-role output](/per-role-output), and more:

```markdown
### Google [2022 – Present]{.right}

_Senior Software Engineer_ [San Francisco, CA]{.right}
```

## Element Attributes

When `{...}` appears at the end of a block element without `[...]`, it applies to the whole element instead of wrapping text in a span:

```markdown
### Google {.small-caps}

## Experience

- Designed REST APIs with OpenAPI documentation {.role:backend}
- Built interactive dashboards with React and D3.js {.role:frontend}
- Led team of 5 engineers to deliver project 2 weeks early
```

## Fenced Divs

Use `:::` to apply attributes to block content. Fenced divs come in two forms:

### Unnamed (Transparent)

When no tag name is given, the fenced div is transparent and attributes fall through to the single child element:

<!-- prettier-ignore-start -->
:::: code-group
```markdown
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

```html
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

![Fenced div with unnamed form](/grid-bullet-with-fence.png)

No wrapper `<div>` is emitted. This is the primary way to style block elements like lists, blockquotes, and tables without adding extra nesting.

If the fenced div contains multiple children, it auto-promotes to a `<div>` wrapper with the attributes:

<!-- prettier-ignore-start -->
:::: code-group
```markdown
::: {.flex .gap-4}
## Title

Some paragraph
:::
```

```html
<div class="flex gap-4">
	<h2>Title</h2>

	<p>Some paragraph</p>
</div>
```

::::
<!-- prettier-ignore-end -->

### Named (Wrapper)

Add a tag name before `{...}` to create a wrapper element:

<!-- prettier-ignore-start -->
:::: code-group
```markdown
::: aside {.sidebar}
## Related Links

Check out these resources

- [Link one](#)
:::
```

```html
<aside class="sidebar">
	<h2>Related Links</h2>

	<p>Check out these resources</p>

	<ul><li><a href="#">Link one</a></li></ul>
</aside>
```
::::
<!-- prettier-ignore-end -->

Any HTML block-level tag works: `div`, `nav`, `article`, `aside`, `section`, `footer`, `header`, `main`, etc.

### Nesting

Fenced divs can be nested. Using more colons for outer divs is optional but improves readability:

```markdown
:::: div {.outer}
::: div {.inner}
Content
:::
::::
```
