# What is Resumx?

<span class="pronounce" data-pronounce="/rɪˈzuːmɪx/ — like resu-mix">**Resumx**</span> (**Resu**me **M**arkdown e**X**pression) renders resumes from Markdown.

```markdown
---
themes: [zurich, oxford]
pages: 1
style:
  section-title-caps: small-caps
  bullet-style: circle
---

# Jane Doe

jane@example.com | github.com/jane | linkedin.com/in/jane

## Experience

### ::logos:google-icon:: Google [2022 - Present]{.float-right}

_Senior Software Engineer_

- Built distributed systems serving 1M requests/day {.role:backend .role:fullstack}
- Built interactive dashboards with ::logos:react:: React {.role:frontend .role:fullstack}
- Designed REST APIs with ::logos:openapi-icon:: OpenAPI specification
```

[**Layout is automatic**](/fit-to-page). Resumx shrinks spacing, font size, and margins when content overflows, and expands them when it's short.

Render with:

```bash
resumx resume.md --format pdf,docx,html
```

That produces a file for every combination of **role**, **theme**, and **format** (3 roles × 2 themes × 3 formats = 18 files).

<!-- TODO: Side-by-side comparison of a sample resume rendered in the Zurich, Oxford, and Seattle themes -->

Edit with [AI](/using-ai). Render from [any commit](/git-superpowers). [Multi-language](/multi-language) from one source. [Get started in under a minute →](/quick-start)
