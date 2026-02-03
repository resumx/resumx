# Fenced Div Plugin for markdown-it

An implementation of the `fenced_divs` extension for markdown-it.
Creates native HTML `<div>` elements with support for classes, IDs, and custom attributes.

## Syntax Overview

A fenced div starts with a fence containing at least three consecutive colons (`:::`)
plus optional attributes. The div ends with another line containing at least three
consecutive colons (without attributes).

### Basic Forms

```markdown
::: {.class} → <div class="class">
::: {#id} → <div id="id">
::: {.class #id} → <div class="class" id="id">
::: {.class attr="value"} → <div class="class" attr="value">
::: component-name → <component-name>
::: component-name {.class} → <component-name class="class">
::: → <div> (plain div, no attributes)
```

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
- Namespaced classes: `.role:frontend` → `class="role:frontend"` (colons allowed)
- Hyphenated: `.my-class` → `class="my-class"`
- Underscored: `.my_class` → `class="my_class"`
- Numeric suffix: `.class123` → `class="class123"`
- Duplicates preserved: `.dup .dup` → `class="dup dup"` (no deduplication)

### Unbraced Word as Component Name

A single unbraced word is treated as a **custom element/component tag name**
(designed for future component compatibility):

```markdown
::: Warning ::::::
This is a warning.
::::::::::::::::::
```

Renders as: `<Warning>...</Warning>`

The unbraced word can be combined with additional attributes in braces:

```markdown
::: callout {.warning #important}
Content
:::
```

Renders as: `<callout class="warning" id="important">...</callout>`

Note: The unbraced word becomes the tag name, and attributes from braces become
the element's classes/id/attributes.

### Trailing Colons (Pandoc Style)

Trailing colons after attributes are supported for visual clarity in nested divs:

```markdown
::: Warning ::::::
Content here
:::

::::: {#special .sidebar} :::::
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
:::: {.outer}
::: {.inner}
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

| Input                           | Behavior                                   |
| ------------------------------- | ------------------------------------------ |
| `::` (2 colons)                 | Not matched (minimum 3 required)           |
| `::: {.class` (unclosed brace)  | Not matched as fenced div                  |
| `:::` inside code block         | Treated as literal text (not parsed)       |
| `:::` in inline code            | Treated as literal text                    |
| `Some text ::: {.class}`        | Not matched (must start line)              |
| `::: {}`                        | Plain `<div>` (empty attributes)           |
| `::: {   }`                     | Plain `<div>` (whitespace-only attributes) |
| Unclosed div at EOF             | Auto-closed with `</div>`                  |
| `::: extra` (text after closer) | Not treated as closer                      |

## Differences from Pandoc

1. **Unbraced word as component name**: Pandoc treats unbraced words as class names
   (`::: Warning` → `<div class="Warning">`), but this implementation treats them
   as component/tag names (`::: Warning` → `<Warning>`). This is designed for future
   component compatibility.
2. **Blank line separation**: Pandoc recommends blank lines before/after fenced divs.
   This implementation does not require them but handles them correctly.
3. **No sanitization**: Class names and IDs are NOT sanitized. Invalid characters
   that match the regex pattern are preserved as-is.

## Examples

### Role-based Sections (Resume Use Case)

```markdown
::: {.role:frontend .role:fullstack}

- Built React components with TypeScript
- Implemented responsive design
  :::
```

### Callout with Warning

```markdown
::: callout {.warning #important-note}
**Warning:** This action cannot be undone.
:::
```

Renders as: `<callout class="warning" id="important-note">...</callout>`

### Complex Nested Layout

```markdown
::: {.container}

## Section Title

::: {.row}
::: {.col}
Left column
:::
::: {.col}
Right column
:::
:::
:::
```

## Token Structure

The plugin generates the following markdown-it tokens:

- `fenced_div_open`: Opening tag (uses component name if provided, otherwise `<div>`)
- `fenced_div_close`: Closing tag (matches opening tag)

Token properties:

- `tag`: The HTML tag name (`div` or component name like `callout`)
- `markup`: The colon fence string (e.g., `:::` or `::::`)
- `info`: The raw info string after the opening fence
- `map`: Line range `[startLine, endLine]`
- `block`: `true` (this is a block-level element)
