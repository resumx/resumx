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

When content overflows, these variables shrink to fit:

| Variable                                                 | Type       | Shrink priority |
| -------------------------------------------------------- | ---------- | --------------- |
| `bullet-gap`, `data-row-gap`, `entry-gap`, `section-gap` | Spacing    | First           |
| `page-margin-x`, `page-margin-y`                         | Margins    | Second          |
| `font-size`, `line-height`                               | Typography | Last            |

Spacing shrinks fastest, margins next, and font size resists change until the overflow is large. A small overflow (say, 1.05 pages) tightens gaps without touching your font size at all. A larger overflow starts reducing margins, and only a severe overflow shrinks the font.

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

If content still cannot reach your target page count at minimums:

- If minimums reduce page count, they are kept as a best effort.
- If minimums do not reduce page count, the original layout is kept for readability.

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
