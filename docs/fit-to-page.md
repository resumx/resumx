# Fit to Page

```markdown
---
pages: 1
---
```

Set a target page count. The layout shrinks to fit if content overflows, expands gaps if there's leftover space on a single page, and stops at readability minimums.

<!-- TODO: side-by-side comparison image — left: 1.1 pages without `pages:`, right: 1 page with `pages: 1` -->

## Usage

Add `pages` to your frontmatter, or pass it from the CLI:

```bash
resumx resume.md --pages 1
```

It works for multi-page targets too: `pages: 2` fits a 2.2-page resume into two.

## What Gets Adjusted

All adjustable variables shrink together by the same proportion:

| Variable                                                 | Type       |
| -------------------------------------------------------- | ---------- |
| `bullet-gap`, `data-row-gap`, `entry-gap`, `section-gap` | Spacing    |
| `font-size`, `line-height`                               | Typography |
| `page-margin-x`, `page-margin-y`                         | Margins    |

A small overflow results in a small reduction across all of them. A larger overflow reduces more, but the ratio stays even.

For `pages: 1`, if content is shorter than a full page, gaps expand to fill the remaining space.

### Minimums

No variable goes below these floors:

| Variable        | Floor  |
| --------------- | ------ |
| `font-size`     | 9pt    |
| `line-height`   | 1.15   |
| `section-gap`   | 4px    |
| `entry-gap`     | 1px    |
| `page-margin-y` | 0.3in  |
| `page-margin-x` | 0.35in |

If content can't fit at minimums, it renders at minimums and stops.

### Interaction with `style:`

When `pages:` is set, `style:` values are starting points, not floors:

```markdown
---
pages: 1
style:
  font-size: 12pt # may be reduced if needed
  section-gap: 15px # may be reduced if needed
---
```

The engine adjusts from your values toward the minimums as needed. Without `pages:`, style values apply as-is.
