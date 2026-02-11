# What is Resumx?

<!-- <span class="pronounce" data-pronounce="/rɪˈzuːmɪx/ — like resu-mix">**Resumx**</span> (**Resu**me **M**arkdown e**X**tension) is a resume-flavored Markdown for building resumes. -->

<span class="pronounce" data-pronounce="/rɪˈzuːmɪx/ — like resu-mix">**Resumx**</span> (**Resu**me **M**arkdown e**X**tension) builds resumes from Markdown — one file, every theme and format.

```markdown
---
roles: [backend, frontend, fullstack]
theme: [zurich, oxford]
formats: [pdf, docx, html]
variables:
  font-size: 10pt
  bullet-style: circle
---

# Jane Doe

jane@example.com | github.com/jane | linkedin.com/in/jane

## Experience

### ::logos:google-icon:: Google [2022 - Present]{.float-right}

_Senior Software Engineer_

- Built distributed systems serving 1M requests/day
- Designed REST APIs with ::logos:openapi-icon:: OpenAPI specification{.role:backend .role:fullstack}
- Built interactive dashboards with ::logos:react:: React {.role:frontend .role:fullstack}
```

Render with:

```bash
resumx resume.md
```

That one command produces a file for every combination of **role**, **theme**, and **format** (3 roles × 2 themes × 3 formats = 18 files). The content stays the same, only the presentation changes.

<!-- TODO: Side-by-side comparison of a sample resume rendered in the Zurich, Oxford, and Seattle themes -->

[Version with git](/git-superpowers). [Edit with AI](/agent-skills).

---

Ready? [Get started in under a minute →](/quick-start)
