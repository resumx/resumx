# Style Options

Resumx exposes a set of style options you can override to customize your resume without touching your Markdown.

## Overriding Styles

Set `style:` in frontmatter to override any option:

```markdown
---
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
  section-border: none
---
```

You can also override via `--style` on the CLI. See the [CLI Reference](/guide/cli-reference) for details.

**Priority:** CLI `--style` > Frontmatter > Defaults

## Options Reference

### Typography

| Variable              | Default              | Description                                              |
| --------------------- | -------------------- | -------------------------------------------------------- |
| `font-family`         | `'Georgia', serif`   | Base font stack (used by title and content when not set) |
| `title-font-family`   | `var(--font-family)` | Font for name (h1) and section headings (h2)             |
| `content-font-family` | `var(--font-family)` | Font for body text, entry titles (h3), bullets, etc.     |
| `font-size`           | `11pt`               | Base font size (10–12pt recommended)                     |
| `line-height`         | `1.35`               | Line height ratio                                        |

### Colors

| Variable           | Default   | Description          |
| ------------------ | --------- | -------------------- |
| `text-color`       | `#333`    | Main text color      |
| `muted-color`      | `#555`    | Secondary text color |
| `accent-color`     | `inherit` | Accent color         |
| `link-color`       | `#0563bb` | Link color           |
| `background-color` | `#fff`    | Page background      |

### Headings

| Variable               | Default                                 | Description                                                    |
| ---------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `name-size`            | `1.85rem`                               | Name (h1) font size                                            |
| `name-caps`            | `normal`                                | Name capitalization (`small-caps`, `all-small-caps`, `normal`) |
| `name-weight`          | `normal`                                | Name font weight                                               |
| `name-style`           | `normal`                                | Name font style (`normal`, `italic`)                           |
| `section-title-size`   | `1.22rem`                               | Section (h2) font size                                         |
| `section-title-caps`   | `normal`                                | Section title capitalization                                   |
| `section-title-weight` | `bold`                                  | Section title font weight                                      |
| `section-header-color` | `var(--text-color)`                     | Section header color                                           |
| `section-border`       | `1px solid var(--section-header-color)` | Section underline border                                       |
| `header-text-align`    | `center`                                | Header alignment (`left`, `center`, `right`)                   |
| `section-header-align` | `left`                                  | Section title alignment                                        |
| `entry-title-size`     | `1.05rem`                               | Entry (h3) font size                                           |
| `entry-title-weight`   | `bold`                                  | Entry title font weight                                        |

### Links

| Variable         | Default | Description                                |
| ---------------- | ------- | ------------------------------------------ |
| `link-underline` | `none`  | Link underline style (`underline`, `none`) |

### Spacing

| Variable           | Default                               | Description                                |
| ------------------ | ------------------------------------- | ------------------------------------------ |
| `page-margin-x`    | `0.5in`                               | Horizontal page margin                     |
| `page-margin-y`    | `0.5in`                               | Vertical page margin                       |
| `section-gap`      | `10px`                                | Gap between sections                       |
| `entry-gap`        | `5px`                                 | Gap between entries                        |
| `bullet-gap`       | `2px`                                 | Gap between bullet points                  |
| `data-row-gap`     | `3px`                                 | Row gap for definition lists and tables    |
| `data-col-gap`     | `12px`                                | Column gap for definition lists and tables |
| `list-indent`      | `1.2em`                               | List indentation                           |
| `two-col-widths`   | `2fr 1fr`                             | Column widths for two-column layout        |
| `two-col-gap`      | `1.5rem`                              | Gap between columns in two-column layout   |
| `two-col-template` | `'header header' 'primary secondary'` | Grid area template for two-column layout   |

### Lists

| Variable       | Default | Description                                             |
| -------------- | ------- | ------------------------------------------------------- |
| `bullet-style` | `disc`  | Bullet point style (`disc`, `circle`, `square`, `none`) |

### Features

| Variable | Default  | Description                     |
| -------- | -------- | ------------------------------- |
| `icons`  | `inline` | Icon display (`inline`, `none`) |

## Style Recipes

A few `style:` snippets that create distinct looks using only variable overrides.

### Classic Serif (the default)

```yaml
style:
  font-family: "'Georgia', serif"
  header-text-align: center
  name-caps: normal
```

No overrides needed, this is what you get out of the box.

### Zurich

Warm serif with small-caps name and accent-colored section headers.

```yaml
style:
  font-family: "'Palatino Linotype', Palatino, Georgia, serif"
  accent-color: '#c43218'
  name-caps: small-caps
  section-header-color: var(--accent-color)
  section-border: 1.5px solid var(--section-header-color)
```

### Seattle

Clean sans-serif with left-aligned header and muted section borders.

```yaml
style:
  font-family: "'Arial', 'Helvetica Neue', sans-serif"
  text-color: '#2d3748'
  section-border: 2px solid #b0b5be
  header-text-align: left
  bullet-style: circle
```

### Minimal

No section borders, tight spacing, all-caps section titles.

```yaml
style:
  section-border: none
  section-title-caps: uppercase
  section-gap: 6px
  entry-gap: 3px
```

### Bold Modern

Strong contrast with a vibrant accent color.

```yaml
style:
  font-family: "'Inter', 'Segoe UI', sans-serif"
  accent-color: '#2563eb'
  name-weight: bold
  section-header-color: var(--accent-color)
  link-color: var(--accent-color)
```
