# Fenced Div Plugin for markdown-it

An implementation of the `fenced_divs` extension for markdown-it with attribute fallthrough support.

## Syntax Overview

A fenced div starts with a fence containing at least three consecutive colons (`:::`)
plus optional attributes. The div ends with another line containing at least three
consecutive colons (without attributes).

### Named vs Unnamed

Fenced divs come in two forms:

- **Named** (has a tag name before `{...}`): Always creates a wrapper element.
- **Unnamed** (no tag name, just `{...}`): Transparent. Attributes fall through to the single child element. No wrapper `<div>` is emitted.

```markdown
::: div {.class} → <div class="class">...</div> (named, wrapper)
::: nav {.sidebar} → <nav class="sidebar">...</nav> (named, wrapper)
::: article → <article>...</article> (named, wrapper)
::: {.class} → attrs applied to single child (unnamed, transparent)
::: → no output, children passed through (unnamed, transparent)
```

### Named Forms

```markdown
::: div {.class} → <div class="class">
::: div {#id} → <div id="id">
::: div {.class #id} → <div class="class" id="id">
::: nav {.class attr="v"} → <nav class="class" attr="v">
::: component-name → <component-name>
::: callout {.class} → <callout class="class">
```

### Unnamed Forms (Attribute Fallthrough)

When no tag name is given, the fenced div is transparent:

```markdown
::: {.grid .grid-cols-3}

- JavaScript
- TypeScript
- Python
  :::
```

Produces `<ul class="grid grid-cols-3">...</ul>` (no wrapper `<div>`).

**Single child:** Attributes are forwarded to the child element.
**Multiple children:** Auto-promotes to a `<div>` wrapper with the attributes.
**Empty:** No output.

## Attribute Syntax

Attributes follow the same syntax as Pandoc fenced code blocks:

| Syntax         | Result                       |
| -------------- | ---------------------------- |
| `.classname`   | `class="classname"`          |
| `#identifier`  | `id="identifier"`            |
| `attr="value"` | `attr="value"`               |
| `attr='value'` | `attr="value"` (normalized)  |
| `attr=value`   | `attr="value"` (unquoted ok) |

### Class Names

- Multiple classes: `.class1 .class2 .class3` → `class="class1 class2 class3"`
- Namespaced classes: `.@frontend` → `class="@frontend"`
- Hyphenated: `.my-class` → `class="my-class"`
- Underscored: `.my_class` → `class="my_class"`
- Numeric suffix: `.class123` → `class="class123"`
- Duplicates preserved: `.dup .dup` → `class="dup dup"` (no deduplication)

### Tag Names

A word before `{...}` is treated as the HTML tag name:

```markdown
::: callout {.warning #important}
Content
:::
```

Renders as: `<callout class="warning" id="important">...</callout>`

### Tag Name Allowlist

Named fenced divs are validated against an allowlist of HTML block-level elements by the `unknown-fenced-div-tag` validator plugin (runs during linting, not compilation). Unrecognized names still render but produce a lint warning:

**Allowed:** `address`, `article`, `aside`, `blockquote`, `details`, `dialog`, `dd`, `div`, `dl`, `dt`, `fieldset`, `figcaption`, `figure`, `footer`, `form`, `header`, `hr`, `li`, `main`, `nav`, `ol`, `p`, `pre`, `section`, `summary`, `table`, `ul`

**Unknown names** (e.g., `::: banana`) render as `<banana>...</banana>` with a lint warning.

**Inline tags** (e.g., `span`, `em`, `a`) are not in the allowlist. Use `[text]{.class}` for inline styling.

### Trailing Colons (Pandoc Style)

Trailing colons after attributes are supported for visual clarity in nested divs:

```markdown
::: Warning ::::::
Content here
:::

::::: div {#special .sidebar} :::::
More content
:::::
```

Both opening and closing fences can have any number of colons (minimum 3).

## Nesting

Fenced divs can be nested. Opening fences are distinguished because they must have
attributes (a component name and/or `{...}` block). Fences without attributes are
always closing fences.

```markdown
::: Warning ::::::
This is a warning.
::: Danger
This is a warning within a warning.
:::
::::::::::::::::::
```

### Nesting Rules

1. **Opening fence**: Has attributes (component name or `{...}`)
2. **Closing fence**: Just `:::` with no attributes
3. **Marker length**: Unlike fenced code blocks, closing fence marker count does NOT
   need to match the opening. However, using different lengths aids visual clarity.
4. **Auto-close**: Unclosed divs are automatically closed at EOF

### Visual Clarity Pattern

```markdown
:::: div {.outer}
::: div {.inner}
Content
:::
::::
```

## Marker Requirements

- **Minimum markers**: 3 colons (`:::`)
- **Maximum markers**: Unlimited (e.g., `::::::::::`)
- **Position**: Must start at beginning of line (after optional indentation)
- **Closing fence**: At least 3 colons, but does NOT need to match opening count
- **Indentation**: Closing fence must be indented less than 4 spaces

## Content Handling

All standard Markdown content is supported inside fenced divs:

- Paragraphs, headings, lists (ordered/unordered)
- Code blocks (fenced and indented)
- Blockquotes, tables, horizontal rules
- Inline formatting (bold, italic, code, links, images)
- Nested fenced divs

Content starting on the opening fence line is treated as part of the info string,
NOT as content. Content must begin on the next line.

## Edge Cases

| Input                           | Behavior                                    |
| ------------------------------- | ------------------------------------------- |
| `::` (2 colons)                 | Not matched (minimum 3 required)            |
| `::: {.class` (unclosed brace)  | Not matched as fenced div                   |
| `:::` inside code block         | Treated as literal text (not parsed)        |
| `:::` in inline code            | Treated as literal text                     |
| `Some text ::: {.class}`        | Not matched (must start line)               |
| `::: div {}`                    | Plain `<div>` (empty attributes)            |
| `::: div {   }`                 | Plain `<div>` (whitespace-only attributes)  |
| `::: {.class}` (single child)   | Attrs forwarded to child, no wrapper        |
| `::: {.class}` (multi children) | Auto-promotes to `<div>` wrapper with attrs |
| `:::` (empty, unnamed)          | No output                                   |
| Unclosed div at EOF             | Auto-closed                                 |
| `::: extra` (text after closer) | Not treated as closer                       |

## Differences from Pandoc

1. **Unbraced word as component name**: Pandoc treats unbraced words as class names
   (`::: Warning` → `<div class="Warning">`), but this implementation treats them
   as component/tag names (`::: Warning` → `<Warning>`). This is designed for future
   component compatibility.
2. **Unnamed fenced divs are transparent**: Pandoc always wraps in `<div>`. This
   implementation uses attribute fallthrough for unnamed fenced divs (no wrapper).
3. **Blank line separation**: Pandoc recommends blank lines before/after fenced divs.
   This implementation does not require them but handles them correctly.
4. **No sanitization**: Class names and IDs are NOT sanitized. Invalid characters
   that match the regex pattern are preserved as-is.

## Examples

### Role-based Sections (Resume Use Case)

```markdown
::: div {.@frontend .@fullstack}

- Built React components with TypeScript
- Implemented responsive design
  :::
```

### Styling a List (Attribute Fallthrough)

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

Produces `<ul class="grid grid-cols-3 gap-x-4 list-none">...</ul>` with no wrapper.

### Callout with Warning

```markdown
::: callout {.warning #important-note}
**Warning:** This action cannot be undone.
:::
```

Renders as: `<callout class="warning" id="important-note">...</callout>`

### Complex Nested Layout

```markdown
::: div {.container}

## Section Title

::: div {.row}
::: div {.col}
Left column
:::
::: div {.col}
Right column
:::
:::
:::
```

## Token Structure

The plugin generates the following markdown-it tokens:

- `fenced_div_open`: Opening tag (uses component name if provided, otherwise `div`)
- `fenced_div_close`: Closing tag (matches opening tag)

Token properties:

- `tag`: The HTML tag name (`div` or component name like `callout`)
- `markup`: The colon fence string (e.g., `:::` or `::::`)
- `info`: The raw info string after the opening fence
- `map`: Line range `[startLine, endLine]`
- `block`: `true` (this is a block-level element)
- `meta.named`: `true` if a tag name was given, `false` for unnamed

For unnamed fenced divs, the `fenced_div_fallthrough` core rule removes the open/close tokens and forwards attributes to the single child element. With multiple children, the tokens are kept as a `<div>` wrapper.
