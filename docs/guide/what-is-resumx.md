# What is Resumx?

Tailored resumes get [10x more interviews](/playbook/tailored-vs-generic), but most people skip it because it means managing multiple files and fixing layout every time. Resumx lets you tailor for every role in a **single file**, with **layout and page fitting handled automatically**.

- **Tailoring without the overhead:** Target variants in one file (`{.@frontend}`, `{.@backend}`), auto-fitted to the page.
- **Layout and fitting handled for you:** Research-backed layout that auto-adjusts, no manual margin nudging.
- **AI-friendly by default:** Plain Markdown in a single file, so AI tools can read, edit, and tailor with full context.
- **More writing, fewer decisions:** Sensible defaults for typography and structure so you focus on substance.

<!-- prettier-ignore-start -->
```markdown
---
pages: 1
---
# Jane Doe

jane@example.com | github.com/jane | linkedin.com/in/jane

## Experience

### :meta: Meta || June 2022 - Present
_Senior Software Engineer_

- Built distributed systems serving 1M requests/day {.@backend}
- Built interactive dashboards using :ts: TypeScript {.@frontend .@fullstack}

## Technical Skills
::: {.grid .grid-cols-2}
- TypeScript
- React
- Vue
- PostgreSQL
:::
```
<!-- prettier-ignore-end -->

<ResumeDemo />

Render with:

```bash
resumx resume.md --format pdf,docx,html
```

That produces a file for every combination of **target** and **format** (3 targets × 3 formats = 9 files).

[Get started in under a minute →](/guide/quick-start) Edit with [AI](/guide/using-ai). Render from [any commit](/guide/git-integration). [Multi-language](/guide/multi-language) from one source.

<span class="pronounce" data-pronounce="/rɪˈzuːmɪx/ — like resu-mix">**Resumx**</span> (**Resu**me **M**arkdown e**X**pression) renders resumes from Markdown.
