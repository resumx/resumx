<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ocmrz/resumx/HEAD/.github/resumx-wordmark-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/ocmrz/resumx/HEAD/.github/resumx-wordmark-light.svg">
    <img alt="Resumx" src="https://raw.githubusercontent.com/ocmrz/resumx/HEAD/.github/resumx-wordmark-light.svg" width="431" height="70">
  </picture>
</p>

<p align="center">
  <strong>/rɪˈzuːmɪx/</strong> — <strong>Resu</strong>me <strong>M</strong>arkdown e<strong>X</strong>pression
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/resumx"><img src="https://img.shields.io/npm/v/resumx?color=blue" alt="npm version"></a>
</p>

<p align="center">
  <a href="https://resumx.dev/guide/"><strong>Documentation</strong></a> | 
  <a href="https://resumx.dev/guide/quick-start"><strong>Quick Start</strong></a>
</p>

---

Resumx renders resumes from Markdown.

It automatically [fits content to the page](/guide/fit-to-page), shrinking spacing, font size, and margins when content overflows and expanding them when it's short.

<!-- prettier-ignore-start -->
```markdown
---
themes: [zurich, oxford]
pages: 1
style:
  section-title-caps: small-caps
---
# Jane Doe
jane@example.com | github.com/jane | linkedin.com/in/jane

## Experience

### :meta: Meta || June 2022 - Present
_Senior Software Engineer_

- Built distributed systems serving 1M requests/day {.role:backend}
- Built interactive dashboards using :ts: TypeScript {.role:frontend .role:fullstack}

## Technical Skills
::: {.grid .grid-cols-2}
- TypeScript
- React
- Vue
- PostgreSQL
:::
```
<!-- prettier-ignore-end -->

Render with:

```bash
resumx resume.md --format pdf,docx,html
```

<img
  src="https://raw.githubusercontent.com/ocmrz/resumx/HEAD/.github/resumx-snippet-zurich-frontend.png"
  alt="Rendered sample of the snippet above, Zurich theme, frontend role"
/>

That produces a file for every combination of **role**, **theme**, and **format** (3 roles × 2 themes × 3 formats = 18 files). Each [theme](/guide/themes) gives the same content a different look:

## Quick Start

**Install:**

```bash
npm install -g resumx
```

### Optional Dependencies

For **DOCX export** (`--format docx`), install pdf2docx:

```bash
# Using pip
pip install pdf2docx

# Using pipx
pipx install pdf2docx

# Using uv
uv tool install pdf2docx
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
