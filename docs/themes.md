# Themes

Themes control how your resume looks. Switch themes without changing your Markdown.

## Built-in Themes

Resumx ships with three themes:

| Theme                | Description                     | Font                     |
| -------------------- | ------------------------------- | ------------------------ |
| **zurich** (default) | Traditional, authoritative look | Palatino Linotype, serif |
| **oxford**           | Clean, timeless design          | Georgia, serif           |
| **seattle**          | Modern, minimal design          | Arial, sans-serif        |

<!-- TODO: Side-by-side preview of all three built-in themes — Zurich, Oxford, and Seattle — rendering the same resume -->

```bash
resumx resume.md                    # Uses zurich (default)
resumx resume.md --theme oxford
resumx resume.md --theme seattle
```

You can render with multiple themes at once to produce separate PDFs:

```bash
resumx resume.md --theme zurich,oxford,seattle
```

## Setting a Default Theme

The default theme is `zurich`. To change it globally:

```bash
resumx theme --default zurich
```

Or set it per-resume in frontmatter:

```yaml
---
theme: zurich
---
```

**Priority order:** CLI `--theme` > Frontmatter `theme` > Global default > `zurich`

## CSS Variables

Override any variable to customize a theme.

```markdown
---
theme: zurich
variables:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
  section-border: none
---
```

You can also override via `--var` on the CLI or set persistent defaults with `resumx theme <name> --set`. See the [CLI Reference](/cli-reference) for details.

**Priority**: CLI `--var` > Frontmatter > Global defaults > Theme defaults

## Variable Reference

### Typography

| Variable      | Default            | Description                          |
| ------------- | ------------------ | ------------------------------------ |
| `font-family` | `'Georgia', serif` | Font stack                           |
| `font-size`   | `11pt`             | Base font size (10–12pt recommended) |
| `line-height` | `1.35`             | Line height ratio                    |

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

| Variable         | Default   | Description                                |
| ---------------- | --------- | ------------------------------------------ |
| `page-margin-x`  | `0.5in`   | Horizontal page margin                     |
| `page-margin-y`  | `0.5in`   | Vertical page margin                       |
| `section-gap`    | `10px`    | Gap between sections                       |
| `entry-gap`      | `5px`     | Gap between entries                        |
| `bullet-gap`     | `2px`     | Gap between bullet points                  |
| `data-row-gap`   | `3px`     | Row gap for definition lists and tables    |
| `data-col-gap`   | `12px`    | Column gap for definition lists and tables |
| `list-indent`    | `1.2em`   | List indentation                           |
| `layout-columns` | `2fr 1fr` | Two-column grid template                   |
| `column-gap`     | `1.5rem`  | Gap between columns                        |

### Lists

| Variable       | Default | Description                                             |
| -------------- | ------- | ------------------------------------------------------- |
| `bullet-style` | `disc`  | Bullet point style (`disc`, `circle`, `square`, `none`) |

### Features

| Variable | Default  | Description                     |
| -------- | -------- | ------------------------------- |
| `icons`  | `inline` | Icon display (`inline`, `none`) |
