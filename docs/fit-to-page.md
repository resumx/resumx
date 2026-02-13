# Fit to Page

```markdown
---
pages: 1
---
```

Declare a target page count. Resumx adjusts the layout to make it fit.

**Shrinks** when content overflows. **Expands** gaps when there's leftover space on a single page. **Stops at readability minimums** so the result doesn't look broken.

<!-- TODO: side-by-side comparison image — left: 1.1 pages without `pages:`, right: 1 page with `pages: 1` -->

## Usage

Add `pages` to your frontmatter, or pass it from the CLI:

```bash
resumx resume.md --pages 1
```

It works for multi-page targets too: `pages: 2` fits a 2.2-page resume into two.

## What Gets Adjusted

When content overflows, variables are adjusted from least to most noticeable:

| Order | Variables                        | Notes             |
| ----- | -------------------------------- | ----------------- |
| 1     | `bullet-gap`, `data-row-gap`     | Almost invisible  |
| 2     | `entry-gap`, `section-gap`       | Barely noticeable |
| 3     | `line-height`                    | Subtle            |
| 4     | `font-size`                      | Noticeable        |
| 5     | `page-margin-x`, `page-margin-y` | Last resort       |

Each phase only activates if the previous one didn't resolve the overflow. For a typical 1.1-page resume, only gaps are touched.

For `pages: 1`, if content is shorter than a full page, gaps **expand** to fill the remaining space (capped at 1.5x their original values). Works across all themes automatically.

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
