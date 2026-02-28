# Tags

Tags are content filters. They control which parts of your resume appear for which audience, without changing how anything renders. [Views](/guide/views) handle rendering. See [How Tailoring Works](/guide/tailoring) for the mental model.

## Tagging Content

Add `{.@name}` to any element to mark it for a specific audience. Untagged content always passes through the filter. Tagged content only appears when rendering for a matching tag.

```markdown
- Built distributed systems serving 1M requests/day
- Built interactive dashboards with React and D3.js {.@frontend}
- Designed REST APIs with OpenAPI documentation {.@backend}
- Led team of 5 engineers to deliver project 2 weeks early
```

::: code-group

```markdown [frontend]
- Built distributed systems serving 1M requests/day
- Built interactive dashboards with React and D3.js
- Led team of 5 engineers to deliver project 2 weeks early
```

```markdown [backend]
- Built distributed systems serving 1M requests/day
- Designed REST APIs with OpenAPI documentation
- Led team of 5 engineers to deliver project 2 weeks early
```

:::

Use multiple classes to include an element in several tags:

```markdown
- Implemented GraphQL API layer with TypeScript {.@backend .@frontend}
```

You can also tag inline text with [bracketed spans](/guide/classes-and-ids#bracketed-spans) or wrap entire sections with [fenced divs](/guide/classes-and-ids#fenced-divs).

<!-- Every tag is renderable with `--for`: -->

<!--
Every tag implicitly carries a [tag view](#tag-views), so `--for frontend` always works even without a `.view.yaml` file. Output files include the view name: `resume-frontend.pdf`, `resume-backend.pdf`. For per-application render configuration (layout, variables, style), create a [custom view](/guide/views#custom-views).

```bash
resumx resume.md --for frontend
resumx resume.md --for backend
``` -->

## Composition

Say you want a `fullstack` filter that includes both `{.@frontend}` and `{.@backend}` content. You could add `{.@fullstack}` to every one of those bullets, but that's tedious. Instead, compose tags in frontmatter. A composed tag extends its filter to cover its constituents:

```yaml
---
tags:
  fullstack: [frontend, backend]
---
```

Now `fullstack` includes all `{.@frontend}` content, all `{.@backend}` content, and any explicitly tagged `{.@fullstack}` content, along with untagged common content.

Compositions can reference other composed tags:

```yaml
---
tags:
  fullstack: [frontend, backend]
  tech-lead: [backend, leadership]
  startup-cto: [fullstack, leadership, architecture]
---
```

`startup-cto` expands transitively: `fullstack` resolves to `frontend` + `backend`, so the final set is `{startup-cto, fullstack, frontend, backend, leadership, architecture}`.

Constituent order is preserved and controls bullet ordering when configured. Circular references (e.g., `a: [b]` and `b: [a]`) are detected and produce an error.

::: info Union only, no intersection
Tags and compositions use union logic only. If you need intersection, make a more specific tag like `{.@senior-frontend}` instead of trying to intersect `@senior` and `@frontend`.
:::

Tags can also carry per-tag render configuration (layout, pages, style). See [Tag Views](/guide/views#tag-views).
