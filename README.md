<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ocmrz/resumx/HEAD/.github/resumx-logo-lockup-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/ocmrz/resumx/HEAD/.github/resumx-logo-lockup-light.svg">
    <img alt="Resumx" src="https://raw.githubusercontent.com/ocmrz/resumx/HEAD/.github/resumx-logo-lockup-light.svg" width="431" height="70">
  </picture>
</p>

<p align="center">
  <strong>/rɪˈzuːmɪx/</strong> — <strong>Resu</strong>me <strong>M</strong>arkdown e<strong>X</strong>pression
</p>

<p align="center">
  AI can rewrite your resume in seconds. Fixing the layout takes longer.<br>
  Resumx adapts layout to every edit, and renders position-specific resumes from one source.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/resumx"><img src="https://img.shields.io/npm/v/resumx?color=blue" alt="npm version"></a>
  <a href="https://github.com/ocmrz/resumx/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="license"></a>
</p>

<p align="center">
  <a href="https://resumx.dev/guide/"><strong>Documentation</strong></a> | 
  <a href="https://resumx.dev/guide/quick-start"><strong>Quick Start</strong></a>
</p>

---

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

### :logos/google-icon: Google [2022 - Present]{.float-right}

_Senior Software Engineer_

- Built distributed systems serving 1M requests/day {.role:backend .role:fullstack}
- Built interactive dashboards with :logos/react: React {.role:frontend .role:fullstack}
- Designed REST APIs with :logos/openapi-icon: OpenAPI specification
```

[**Layout is automatic**](https://resumx.dev/guide/fit-to-page). Resumx shrinks spacing, font size, and margins when content overflows, and expands them when it's short.

Render with:

```bash
resumx resume.md --format pdf,docx,html
```

That produces a file for every combination of **role**, **theme**, and **format** (3 roles × 2 themes × 3 formats).

<!-- TODO: image for side-by-side of the same resume in Zurich, Oxford, and Seattle themes -->

## Quick Start

**Install:**

```bash
npm install -g resumx
```

**Run:**

```bash
resumx init resume.md     # Generate a template resume
resumx resume.md --watch  # Live preview
```

## Install Agent Skills

```bash
npx skills add ocmrz/resumx
```

This enables AI assistants like Cursor, Claude Code, and Copilot to understand and work with your Resumx files.

<!-- TODO: image for terminal output of resumx init + render -->

## CLI

| Command                                | Description             |
| -------------------------------------- | ----------------------- |
| `resumx [file]`                        | Render to PDF (default) |
| `resumx [file] --watch`                | Live preview            |
| `resumx [file] --theme zurich,oxford`  | Multiple themes         |
| `resumx [file] --role frontend`        | Role-specific output    |
| `resumx [file] --format pdf,html,docx` | PDF + HTML + DOCX       |
| `resumx [file] --pages 1`              | Fit to 1 page           |
| `resumx init`                          | Create from template    |

See the full [CLI Reference](https://resumx.dev/guide/cli-reference).

## Documentation

For full documentation, visit [resumx.dev](https://resumx.dev/guide).

## License

[Apache License 2.0](LICENSE)
