<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ocmrz/resumx/HEAD/.github/resumx-wordmark-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/ocmrz/resumx/HEAD/.github/resumx-wordmark-light.svg">
    <img alt="Resumx" src="https://raw.githubusercontent.com/ocmrz/resumx/HEAD/.github/resumx-wordmark-light.svg" width="431" height="70">
  </picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/resumx"><img src="https://img.shields.io/npm/v/resumx?color=blue" alt="npm version"></a>
</p>

<p align="center">
  <a href="https://resumx.dev/guide/"><strong>Documentation</strong></a> | 
  <a href="https://resumx.dev/playbook/resume-length"><strong>The Resume Playbook</strong></a>
</p>

---

Tailored resumes get [10x more interviews](https://resumx.dev/playbook/tailored-vs-generic), but most people skip it because it means managing multiple files and fixing layout every time. Resumx lets you tailor for every role in a **single file**, with **layout and page fitting handled automatically**.

- **Tailoring without the overhead:** Target variants in one file (`{.@frontend}`, `{.@backend}`), auto-fitted to the page.
- **Layout and fitting handled for you:** Research-backed layout that auto-adjusts, no manual margin nudging.
- **AI-friendly by default:** Plain Markdown in a single file, so AI tools can read, edit, and tailor with full context.
- **More writing, fewer decisions:** Sensible defaults for typography and structure so you focus on substance.

<!-- prettier-ignore-start -->
```markdown
---
pages: 1
style:
  section-title-caps: small-caps
---
# Jane Doe

jane@example.com | github.com/jane | linkedin.com/in/jane

## Experience

### :meta: Meta || June 2022 - Present
_Senior Software Engineer_

- Built distributed systems serving 1M requests/day {.@frontend}
- Built interactive dashboards using :ts: TypeScript {.@vercel-swe}

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
  alt="Rendered sample of the snippet above, frontend targetted"
/>

That produces a file for every combination of **target** and **format** (3 targets × 3 formats = 9 files).

## Quick Start

**Install:**

```bash
npm install -g resumx
npx playwright install chromium
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
| `resumx [file] --css my-styles.css`    | Custom CSS file         |
| `resumx [file] --target frontend`      | Target-specific output  |
| `resumx [file] --format pdf,html,docx` | PDF + HTML + DOCX       |
| `resumx [file] --pages 1`              | Fit to 1 page           |
| `resumx init`                          | Create from template    |

See the full [CLI Reference](https://resumx.dev/guide/cli-reference).

## Documentation

For full documentation, visit [resumx.dev](https://resumx.dev/guide).

## License

[Apache License 2.0](LICENSE)
