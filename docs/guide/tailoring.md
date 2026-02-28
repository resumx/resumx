# How Tailoring Works

## The Mental Model

Think of `resume.md` as a database of everything you've done. Each application is a query against that database.

```
resume.md       (all your career data)
  × tags        (WHERE — filter what's relevant)
  × layout      (SELECT — which sections, in what order)
  × vars        (SET — role-specific keywords, taglines)
  × style       (FORMAT — presentation adjustments)
  → output      (PDF, HTML, DOCX, or PNG)
```

Your career data is durable, it accumulates over years. The way you present it changes with every application. Tags filter the content, views shape the output.

## Tags and Views

Two independent concerns combine to produce each render:

|                       | Purpose             | SQL analogy         |
| --------------------- | ------------------- | ------------------- |
| [Tags](/guide/tags)   | Filter content      | `WHERE`             |
| [Views](/guide/views) | Configure rendering | `SELECT` + `FORMAT` |

**Tags** decide what's in and what's out. Add `{.@frontend}` to a bullet and it only appears when rendering for `frontend`. Compose tags (`fullstack: [frontend, backend]`) to build reusable content sets. Tags are purely filters, they never touch rendering.

**Views** decide how filtered content renders: which sections appear, in what order, what keywords to inject, how many pages to target. Every render uses a view, even if you never create one explicitly.

Both are optional and independent. You can use tags without views, views without tags, or both together. A resume with neither produces a single PDF with everything included.
