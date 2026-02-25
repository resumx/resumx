# What is Resumx?

<span class="pronounce" data-pronounce="/rɪˈzuːmɪx/ — like resu-mix">**Resumx**</span> (**Resu**me **M**arkdown e**X**pression) renders resumes from Markdown.

It automatically [**fits content to the page**](/guide/fit-to-page), shrinking spacing, font size, and margins when content overflows and expanding them when it's short.

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
- Built interactive dashboards using :ts: TypeScript {.@frontend}

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

That produces a file for every combination of **role** and **format** (3 roles × 3 formats = 9 files).

Edit with [AI](/guide/using-ai). Render from [any commit](/guide/git-integration). [Multi-language](/guide/multi-language) from one source. [Get started in under a minute →](/guide/quick-start)
