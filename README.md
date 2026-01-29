<p align="center">
  <img src="https://github.com/ocmrz/resum8/raw/main/assets/og-image.png" alt="resum8 banner" width="100%">
</p>

# resum8

<p align="center">
  <a href="https://www.npmjs.com/package/resum8"><img src="https://img.shields.io/npm/v/resum8?color=blue" alt="npm version"></a>
  <a href="https://github.com/ocmrz/resum8/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license"></a>
</p>

<p align="center">
  No schemas. No lock-in. Just markdown.
</p>

Write your resume in markdown. Render it anywhere.

## Why resum8?

- **Just markdown** — No schema, no templating language, just syntax you already know
- **Beautiful defaults** — Professional templates that look great out of the box
- **Git-native** — Plain text files, meaningful diffs, branch your resume versions
- **AI-friendly** — Markdown plays well with LLMs for writing and editing
- **Tailwind-compatible** — Use the same class for styling as Tailwind CSS v4
- **Easily ejectable** — Copy the stylesheet to your project and customize it to your liking

## Sample

```markdown
# Adrian Sterling

> [+1 555-123-4567](tel:+15551234567) | [adrian.sterling@email.com](mailto:adrian.sterling@email.com) | [linkedin.com/in/adriansterling](https://linkedin.com/in/adriansterling) | [github.com/adriansterling](https://github.com/adriansterling)

## Education

### Stanford University [Sept 2018 - June 2022]{.float-right}

_Bachelor of Science in Computer Science, Summa Cum Laude_

- Cumulative GPA: 3.82 | Dean's List (2019-2022) | Computer Science Excellence Award
- Advanced coursework: Distributed Systems, Advanced Algorithms, Compiler Design, Applied Cryptography
- President, Computer Science Student Association (2021-2022) — Led 200+ members, organized FAANG speaker series

## Work Experience

### Google [June 2022 - Present]{.float-right}

_Senior Software Engineer, Infrastructure Platform Team_ [San Francisco, CA]{.float-right}

- Architected distributed microservices orchestration platform with `Kubernetes` and `Docker`
- Reduced deployment latency by 60% across 50+ services
- Led cloud-native migration on `Google Cloud`, improving scalability 300% and saving $2M annually
- Built CI/CD pipeline with `Cloud Build`, `Terraform`, `GitOps` reducing release cycles to 2 days
```

![Rendered PDF](https://github.com/ocmrz/resum8/raw/main/assets/rendered.png)

## Get Started

1. Install the CLI:

   ```bash
   pip install pdf2docx   # or pipx install pdf2docx / uv tool install pdf2docx

   npm install -g resum8
   ```

   PDF rendering uses [Playwright](https://playwright.dev/) with a bundled Chromium installed automatically.

2. Create your first resume:

   ```bash
   m8 init resume.md   # Generate a template resume
   m8 resume.md        # Render to PDF
   ```

3. (Optional) Customize your output:

   ```bash
   m8 resume.md --style formal   # Apply a different style
   m8 resume.md --html           # Generate HTML
   m8 resume.md --docx           # Generate DOCX (requires: pip install pdf2docx)
   m8 resume.md --all            # PDF, HTML, and DOCX
   m8 resume.md --watch          # Auto-rebuild on changes
   ```

## Writing Your Resume

Write your resume in standard markdown syntax. Use bracketed spans like `[text]{.float-right}` with Tailwind CSS v4 classes to style your resume (see [syntax reference](docs/syntax.md)).

```markdown
# Jane Doe

> [jane@example.com](mailto:jane@example.com) | [linkedin.com/in/janedoe](https://linkedin.com/in/janedoe) | [github.com/janedoe](https://github.com/janedoe)

## Experience

### Acme Corp [Jan 2022 - Present]{.float-right}

_Senior Software Engineer_ [San Francisco, CA]{.float-right}

- Built REST API serving 10k requests/min using `Node.js` and `Redis`
- Led team of 10 engineers to deliver project on time
```

See the [full syntax reference](docs/syntax.md) for tables, skills sections, and more.

## CLI Commands

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `m8 <file>`            | Render to PDF (default)                          |
| `m8 <file> --html`     | Render to HTML                                   |
| `m8 <file> --docx`     | Render to DOCX (.docx)                           |
| `m8 <file> --all`      | Render all formats                               |
| `m8 <file> -w`         | Watch mode (auto-rebuild)                        |
| `m8 <file> -s <style>` | Use specific style                               |
| `m8 init [filename]`   | Create resume from template (default: resume.md) |
| `m8 eject [style]`     | Copy style to ./styles/ for customization        |
| `m8 style`             | List available styles                            |
| `m8 style -d <name>`   | Set default style                                |

### Examples

```bash
m8 resume.md                 # → resume.pdf
m8 resume.md --html          # → resume.html
m8 resume.md --all           # → all formats
m8 resume.md --watch         # watch mode
m8 resume.md --style formal  # use formal style
m8 resume.md --output cv     # → cv.pdf
```

### Frontmatter Configuration

Configure rendering options directly in your markdown file using YAML or TOML frontmatter:

```yaml
---
style: formal
outputName: john-doe-resume
outputDir: ./dist
formats:
  - pdf
  - html
variables:
  font-family: 'Inter, sans-serif'
  section-header-color: '#2563eb'
---
# John Doe

Your resume content here...
```

| Field        | Type   | Description                             |
| ------------ | ------ | --------------------------------------- |
| `style`      | string | Style to use (classic, formal, minimal) |
| `outputName` | string | Output filename (without extension)     |
| `outputDir`  | string | Output directory path                   |
| `formats`    | array  | Output formats: `pdf`, `html`, `docx`   |
| `variables`  | object | CSS variable overrides                  |

CLI flags always take precedence over frontmatter values.

### CSS Variable Customization

Override CSS variables without ejecting:

```bash
m8 resume.md --var font-family="Arial"
m8 resume.md --var section-header-color="#0066cc"
```

## Styles

Three built-in styles: `classic` (default), `formal`, `minimal`

```bash
m8 style                      # List available styles
m8 style --default formal     # Set default style
m8 resume.md --style minimal  # Use a specific style (one-time)
m8 eject formal               # Copy to ./styles/ for customization
```

## Requirements

**For CLI:**

- [Node.js](https://nodejs.org/) 20+
- **PDF / HTML:** None. The package uses Playwright with a bundled Chromium (installed automatically via `npm install`).
- **DOCX** (when using `--docx` or `--all`): [pdf2docx](https://github.com/dothinking/pdf2docx) to convert PDF to Word. Install with:

  ```bash
  pip install pdf2docx
  ```

**Development (contributors):**

```bash
git clone <repo>
cd resum8
npm install          # installs deps and runs `npx playwright install chromium`
npm run build        # compile TypeScript
npm test             # run tests
```

**For stylesheet-only:** Any markdown-to-HTML/PDF tool that supports custom CSS.

## License

MIT
