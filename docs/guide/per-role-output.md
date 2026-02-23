# Per-Role Output

Maintain one master resume instead of juggling multiple files. Tag content for different roles, and Resumx automatically generates a tailored PDF for each job target.

## Tagging Content

Add `{.role:name}` to any element. Untagged content is always included; tagged content only appears when generating for a matching role.

```markdown /{.role:frontend}/ /{.role:backend}/
- Built distributed systems serving 1M requests/day
- Built interactive dashboards with React and D3.js {.role:frontend}
- Designed REST APIs with OpenAPI documentation {.role:backend}
- Led team of 5 engineers to deliver project 2 weeks early
```

The first and last bullets are shared. The middle two only appear in their respective role variants:

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

Use multiple role classes to include an element in several variants:

```markdown /{.role:backend .role:fullstack}/
- Implemented GraphQL API layer with TypeScript {.role:backend .role:fullstack}
```

You can also tag inline text with [bracketed spans](/guide/classes-and-ids#bracketed-spans) or wrap entire sections with [fenced divs](/guide/classes-and-ids#fenced-divs).

![multiple role specific resume side by side in a table]()

## Generating Role-Specific Resumes

**By default, Resumx discovers all `role:*` classes in your content and generates a separate PDF for each — no configuration needed.**

If you don't need every variant, use `-r` / `--role` to limit which ones get generated:

```bash
resumx resume.md --role frontend
resumx resume.md --role frontend,backend
```

Or in frontmatter:

```markdown
---
roles: [frontend, backend]
---
```

Output files include the role name: `resume-frontend.pdf`, `resume-backend.pdf`, etc.
