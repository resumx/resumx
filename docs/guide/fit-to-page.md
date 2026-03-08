# Fit to Page

```markdown
---
pages: 1
---
```

Set a target page count. The layout shrinks to fit if content overflows, and stops at readability minimums.

<!-- TODO: side-by-side comparison image — left: 1.1 pages without `pages:`, right: 1 page with `pages: 1` -->

### What Gets Adjusted

When content overflows, these variables shrink to fit:

| Variable                              | Type       | Shrink priority |
| ------------------------------------- | ---------- | --------------- |
| `row-gap`, `entry-gap`, `section-gap` | Spacing    | First           |
| `page-margin-x`, `page-margin-y`      | Margins    | Second          |
| `font-size`, `line-height`            | Typography | Last            |

Spacing shrinks fastest, margins next, and font size resists change until the overflow is large. A small overflow (say, 1.05 pages) tightens gaps without touching your font size at all. A larger overflow starts reducing margins, and only a severe overflow shrinks the font.

When `pages:` is set, `style:` values become starting points, not floors, and may be reduced as needed.

Every variable has a readability minimum (e.g., font size won't go below 9pt). If content still can't fit at minimums, the engine keeps the best result it can reach.
