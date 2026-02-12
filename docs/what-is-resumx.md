# What is Resumx?

<span class="pronounce" data-pronounce="/rɪˈzuːmɪx/ — like resu-mix">**Resumx**</span> (**Resu**me **M**arkdown e**X**pression) builds resumes from Markdown — one file, every theme and format.

```markdown
---
themes: [zurich, oxford]
style:
  font-size: 10pt
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

Render with:

```bash
resumx resume.md --format pdf,docx,html
```

That one command produces a file for every combination of **role**, **theme**, and **format** (3 roles × 2 themes × 3 formats = 18 files). The content stays the same, only the presentation changes.

<!-- TODO: Side-by-side comparison of a sample resume rendered in the Zurich, Oxford, and Seattle themes -->

[Edit with AI](/agent-skills). [Version with git](/git-superpowers).

Ready? [Get started in under a minute →](/quick-start)
