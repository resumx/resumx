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

In resume writing, the real leverage is **content quality and tailoring for the role** ([**10.6x higher interview rates**](https://resumx.dev/playbook/tailored-vs-generic)), but those are what existing tools ignore. Resumx makes tailoring easier and everything else, layout, page fitting, styling, cost you zero effort.

- **Tailoring without the overhead.** One Markdown file with target variants (`{.@frontend}`, `{.@backend}`), many tailored outputs, each auto-fitted to the page.
- **Layout and fitting handled for you.** An opinionated, research-backed layout that adjusts automatically. No manual margin nudging.
- **AI-friendly by default.** Content in a single file means AI can help draft, refine, and tailor your content without losing context.
- **More writing, fewer decisions.** Sensible defaults for typography and structure so you can spend your time on substance.

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
