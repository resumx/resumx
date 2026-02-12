<!-- TODO: image for banner/og-image -->

<h1 align="center">Resumx</h1>

<p align="center">
  <strong>/rɪˈzuːmɪx/</strong> — <strong>Resu</strong>me <strong>M</strong>arkdown e<strong>X</strong>pression
</p>

<p align="center">
  One Markdown file. Every role, theme, and format.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/resumx"><img src="https://img.shields.io/npm/v/resumx?color=blue" alt="npm version"></a>
  <a href="https://github.com/ocmrz/resumx/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="license"></a>
</p>

---

Write your resume in Markdown. Configure themes and styles in frontmatter, choose roles and formats from the CLI. One command renders every combination.

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

- Built distributed systems serving 1M requests/day
- Designed REST APIs with ::logos:openapi-icon:: OpenAPI specification {.role:backend .role:fullstack}
- Built interactive dashboards with ::logos:react:: React {.role:frontend .role:fullstack}
```

```bash
resumx resume.md --role backend,frontend,fullstack --format pdf,docx,html
```

That one command produces a file for every combination of **role**, **theme**, and **format** (3 roles × 2 themes × 3 formats = 18 files). The content stays the same — only the presentation changes.

<!-- TODO: image for side-by-side of the same resume in Zurich, Oxford, and Seattle themes -->

## Quick Start

**Requirements:** Node.js 20+

```bash
npm install -g resumx          # Install
resumx init resume.md          # Generate a template resume
resumx resume.md --watch       # Live preview — rebuilds on every save
```

<!-- TODO: image for terminal output of resumx init + render -->

Open `resume.md` in your editor and start writing. Read the full [Quick Start guide](docs/quick-start.md).

## Features

- **Per-role output** — Tag content with `{.role:frontend}`, get `resume-frontend.pdf` automatically. [Per-Role Output](docs/per-role-output.md)
- **Agent Skills** — AI-ready for Cursor, Claude Code, Copilot. `npx skills add ocmrz/resumx`. [Agent Skills](docs/agent-skills.md)
- **Git superpowers** — Render from any commit or tag, auto-validate on commit. [Git Superpowers](docs/git-superpowers.md)
- **Interpolation** — Dynamic values like `{{ new Date().getFullYear() - 2018 }}+ years`. [Interpolation](docs/interpolation.md)
- **200,000+ icons** — Auto-icons for links, inline tech logos via `::react::` shorthand or Iconify. [Icons](docs/icons.md)
- **Tailwind CSS v4** — Style any element with utility classes: `[React]{.bg-blue-100 .text-blue-800 .px-2 .rounded}`. [Tailwind CSS](docs/tailwind-css.md)
- **Full CSS control** — Eject any theme with `resumx eject zurich` and own the CSS. [Custom CSS](docs/custom-css.md)
- **40+ CSS variables** — Override fonts, colors, spacing without writing CSS. [Themes > Variables](docs/themes.md#css-variables)
- **3 built-in themes** — Zurich, Oxford, Seattle. Switch with `--theme` or in frontmatter. [Themes](docs/themes.md)

## CLI at a Glance

| Command                                | Description               |
| -------------------------------------- | ------------------------- |
| `resumx [file]`                        | Render to PDF (default)   |
| `resumx [file] --watch`                | Live preview              |
| `resumx [file] --theme zurich,oxford`  | Multiple themes           |
| `resumx [file] --role frontend`        | Role-specific output      |
| `resumx [file] --format pdf,html,docx` | PDF + HTML + DOCX         |
| `resumx init`                          | Create from template      |
| `resumx eject [theme]`                 | Copy theme CSS locally    |
| `resumx theme`                         | List / manage themes      |
| `resumx validate`                      | Validate resume structure |

See the full [CLI Reference](docs/cli-reference.md).

## Documentation

For full documentation, visit [resumx.dev](https://resumx.dev).

## License

[Apache License 2.0](LICENSE)
