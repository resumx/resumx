# Tailored Variants

Maintain one master resume instead of juggling multiple files. Tag content for different targets, and Resumx automatically generates a tailored PDF for each.

## Tagging Content

Add `{.@name}` to any element. Untagged content is always included; tagged content only appears when generating for a matching target.

```markdown
- Built distributed systems serving 1M requests/day
- Built interactive dashboards with React and D3.js {.@frontend}
- Designed REST APIs with OpenAPI documentation {.@backend}
- Led team of 5 engineers to deliver project 2 weeks early
```

The first and last bullets are shared. The middle two only appear in their respective target variants:

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

Use multiple target classes to include an element in several variants:

```markdown
- Implemented GraphQL API layer with TypeScript {.@backend .@fullstack}
```

You can also tag inline text with [bracketed spans](/guide/classes-and-ids#bracketed-spans) or wrap entire sections with [fenced divs](/guide/classes-and-ids#fenced-divs).

![multiple target specific resume side by side in a table]()

## Generating Target-Specific Resumes

**By default, Resumx discovers all `@*` classes in your content and generates a separate PDF for each, no configuration needed.**

If you don't need every variant, use `-t` / `--target` to limit which ones get generated:

```bash
resumx resume.md --target frontend
resumx resume.md --target frontend,backend
```

Output files include the target name: `resume-frontend.pdf`, `resume-backend.pdf`, etc.

## Target Composition

Instead of tagging every bullet with multiple targets, define composed targets in frontmatter. A composed target is the **union** of its constituents: when rendering for that target, content tagged with any constituent is included.

```yaml
---
targets:
  fullstack: [frontend, backend]
---
```

Now `resumx resume.md --target fullstack` includes all `{.@frontend}` content, all `{.@backend}` content, and any explicitly tagged `{.@fullstack}` content, along with untagged common content.

### Recursive Composition

Compositions can reference other composed targets:

```yaml
---
targets:
  fullstack: [frontend, backend]
  tech-lead: [backend, leadership]
  startup-cto: [fullstack, leadership, architecture]
---
```

`startup-cto` expands transitively: `fullstack` resolves to `frontend` + `backend`, so the final set is `{startup-cto, fullstack, frontend, backend, leadership, architecture}`.

### How It Works

Composed target names are added to the auto-discovered set. If your content tags `frontend`, `backend`, and `leadership`, and frontmatter declares `fullstack: [frontend, backend]`, Resumx generates PDFs for `frontend`, `backend`, `leadership`, and `fullstack`. Use `--target` to filter if you only want specific ones.

Declaration order does not matter. Circular references (e.g., `a: [b]` and `b: [a]`) are detected and produce an error.
