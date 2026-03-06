![Resumx OG Image](https://raw.githubusercontent.com/resumx/resumx/HEAD/.github/resumx-og-image.png)

---

<p align="center">
  <a href="https://www.npmjs.com/package/@resumx/resumx"><img src="https://img.shields.io/npm/v/@resumx/resumx?color=blue" alt="npm version"></a>
</p>

<p align="center">
  <a href="https://resumx.dev/"><strong>Documentation</strong></a> | 
  <a href="https://resumx.dev/playbook/resume-length.html"><strong>The Resume Playbook</strong></a>
</p>

Tailored resumes get [10x more interviews](https://resumx.dev/playbook/tailored-vs-generic.html), but most people skip it because it means managing multiple files and re-fitting everything to one page. Resumx lets you tailor for every role in a single file, and auto-fits your content to the page count you set

- **Always fits the page:** Set `pages: 1` and add or remove content freely, Resumx scales typography and spacing so it always lands on exactly one page.
- **Tailoring without the overhead:** Target variants in one file (`{.@frontend}`, `{.@backend}`).
- **AI agent skills included:** Ships with [agent skills](https://resumx.dev) so OpenClaw, Claude Code, and any other AIs understand Resumx syntax, and write in best practices.
- **30+ style options:** Tweak colors, fonts, spacing, bullet styles, etc. from frontmatter. No CSS required.
- **Catch mistakes before recruiters do:** Built-in validation flags weak bullets, missing info, and formatting issues before you hit send.

<!-- prettier-ignore-start -->
```markdown
---
pages: 1
tags:
  fullstack: [frontend, backend]
style:
  section-title-color: "#c43218"
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

Render with:

```bash
resumx resume.md --for backend,frontend,fullstack
```

<img
  src="https://raw.githubusercontent.com/resumx/resumx/HEAD/.github/resumx-snippet-zurich-frontend.png"
  alt="Rendered sample of the snippet above, frontend targetted"
/>

### Also included

- **200k+ icons, zero config:** Add any of 200k+ icons with `:icon-name:` syntax.
- **Tailwind CSS built in:** Apply utility classes directly in Markdown with `{.class}` syntax, compiled on-the-fly with Tailwind v4.
- **Live preview:** `resumx --watch` rebuilds on every save so you see changes instantly.
- **PDF, HTML, DOCX, and PNG:** One source, four output formats.
- **Per-application views:** Create `.view.yaml` files with custom taglines, section order, and tag selections for each company, then batch-render with `--for '*'`.
- **Multi-language output:** Tag content with `{lang=en}` / `{lang=fr}` to produce localized resumes from a single file.
- **Template variables:** Swap in per-application text like `{{ tagline }}` without touching the resume itself.
- **Git-native workflow:** Render from any previous commit or tag.

## Quick Start

**Install:**

```bash
npm install -g @resumx/resumx
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
npx skills add resumx/resumx
```

This enables AI assistants like Cursor, Claude Code, and Copilot to understand and work with your Resumx files.

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

See the full [CLI Reference](https://resumx.dev/guide/cli-reference.html).

## Documentation

For full documentation, visit [resumx.dev](https://resumx.dev).

## License

[Apache License 2.0](LICENSE)
