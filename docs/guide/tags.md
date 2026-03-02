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

`startup-cto` expands <span class="hint" data-hint="includes the children of children, not just direct children">transitively</span>: `fullstack` resolves to `frontend` + `backend`, so the final set is `{startup-cto, fullstack, frontend, backend, leadership, architecture}`.

Every tag in the group must exist as a content tag (`{.@name}` in your resume) or as another composed tag — if it doesn't, Resumx raises an error with a suggestion for likely typos. Order is preserved and controls bullet ordering when configured. Circular references (e.g., `a: [b]` and `b: [a]`) are detected and produce an error.

::: info Union only, no intersection
Tags and compositions use union logic only. If you need intersection, make a more specific tag like `{.@senior-frontend}` instead of trying to intersect `@senior` and `@frontend`.
:::

Tags can also carry per-tag render configuration (layout, pages, style). See [Tag Views](/guide/views#tag-views).

## Hierarchical Tags

When a domain spans multiple ecosystems, flat tags force a choice: tag broadly (`@backend`) and lose the ability to differentiate stacks, or tag narrowly (`@node`, `@jvm`) and lose the shared parent context. Hierarchical tags solve this by encoding the relationship directly.

### Syntax

Use `/` to nest a child tag under its parent:

```markdown
- Designed REST APIs with OpenAPI documentation {.@backend}
- Built microservices with `Express` and `Bull` queues {.@backend/node}
- Migrated `Spring Boot` monolith to modular architecture {.@backend/jvm}
```

Depth is unlimited: `{.@data/ml/nlp}` is valid and nests three levels deep.

### Inheritance

One rule: **include your entire lineage (ancestors + self + descendants) and untagged content. Siblings and their subtrees are excluded.**

| Render               | Includes                                                         | Excludes                             |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------ |
| `--for backend/node` | `@backend` + `@backend/node` + untagged                          | `@backend/jvm`, `@frontend`, etc.    |
| `--for backend`      | `@backend` + `@backend/node` + `@backend/jvm` + untagged         | `@frontend`, `@leadership`, etc.     |
| `--for data/ml`      | `@data` + `@data/ml` + `@data/ml/nlp` + `@data/ml/cv` + untagged | `@data/analytics`, `@frontend`, etc. |

A child view (`--for backend/node`) inherits its ancestor's generic content (`@backend`), so a "Designed REST APIs" bullet tagged `@backend` appears in both the `backend/node` and `backend/jvm` views. A parent view (`--for backend`) includes all of its descendants, giving a complete picture of the domain.

Click any node below to see which tags are included:

<TagLineage />

### Composition with Hierarchical Tags

Hierarchical tags work with [composition](#composition). Lineage expands per constituent:

```yaml
---
tags:
  stripe: [frontend, backend/node]
---
```

`stripe` expands to: `@frontend` (+ any `@frontend/*` descendants) + `@backend` (ancestor of `backend/node`) + `@backend/node` + untagged. Sibling `@backend/jvm` is excluded because only `backend/node` was listed, not `backend`.

### When to Use Hierarchy

Use hierarchy when a domain genuinely splits into non-interchangeable ecosystems, and you need both the broad view and the narrow view. A few guidelines:

- **Good:** `backend/node`, `backend/jvm` (different stacks, shared parent context)
- **Good:** `data/ml/nlp`, `data/ml/cv` (sub-specialties within ML)
- **Unnecessary:** `frontend/css` (CSS is rarely a standalone hiring filter)
- **Wrong:** `backend/api` (APIs are part of all backend work, not a separate ecosystem)

If you wouldn't create a separate resume variant for it, it probably doesn't need its own tag level.
