![Resumx OG Image](/og-image.png)

---

Tailored resumes get [10x more interviews](/playbook/tailored-vs-generic), but most people skip it because it means managing multiple files and re-fitting everything to one page. Resumx lets you tailor for every role in a single file, and auto-fits your content to the page count you set

- **Tailoring without the overhead:** Tag content for different audiences in one file (`{.@frontend}`, `{.@backend}`), each auto-fitted to your page limit.
- **Always fits the page:** Set `pages: 1` and add or remove content freely, Resumx scales typography and spacing so it always lands on exactly one page.
- **AI-friendly by default:** Plain Markdown in a single file, so AI tools can read, edit, and tailor with full context.
- **More writing, fewer decisions:** Sensible defaults for layout and structure so you focus on substance.

<!-- prettier-ignore-start -->
```markdown
---
pages: 1
tags:
  fullstack: [frontend, backend]
---
# Jane Doe

jane@example.com | github.com/jane | linkedin.com/in/jane

{{ tagline }}

## Experience

### :meta: Meta || June 2022 - Present
_Senior Software Engineer_

- Built distributed systems serving 1M requests/day {.@backend}
- Built interactive dashboards using :ts: TypeScript {.@frontend}

## Technical Skills
::: {.@backend .grid .grid-cols-2}
- Go
- Kafka
- PostgreSQL
- Redis
:::

::: {.@frontend .grid .grid-cols-2}
- TypeScript
- React
- Vue
- PostgreSQL
:::
```
<!-- prettier-ignore-end -->

<ResumeDemo />

[Get started in under a minute →](/guide/quick-start) Edit with [AI](/guide/using-ai). Render from [any commit](/guide/git-integration). [Multi-language](/guide/multi-language) from one source.
