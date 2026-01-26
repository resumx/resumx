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

- **Freeform markdown** — No schema, no HTML, just natural prose
- **Portable** — Works with Pandoc, md-to-pdf, mdpdf, or any markdown tool
- **Own your styles** — Adopt template styles to your project, tweak it, and make it yours
- **AI-friendly** — Let AI help write and refine your resume
- **No lock-in** — Grab the stylesheet, skip the CLI entirely if you want

## Sample

```markdown
# Adrian Sterling

> [+1 555-123-4567](tel:+15551234567) | [adrian.sterling@email.com](mailto:adrian.sterling@email.com) | [linkedin.com/in/adriansterling](https://linkedin.com/in/adriansterling) | [github.com/adriansterling](https://github.com/adriansterling)

## Education

### Stanford University [Sept 2018 - June 2022](#right)
*Bachelor of Science in Computer Science, Summa Cum Laude*

- Cumulative GPA: 3.82 | Dean's List (2019-2022) | Computer Science Excellence Award
- Advanced coursework: Distributed Systems, Advanced Algorithms, Compiler Design, Applied Cryptography
- President, Computer Science Student Association (2021-2022) — Led 200+ members, organized FAANG speaker series

## Work Experience

### Google [June 2022 - Present](#right)
*Senior Software Engineer, Infrastructure Platform Team* [San Francisco, CA](#right)

- Architected distributed microservices orchestration platform with `Kubernetes` and `Docker`
- Reduced deployment latency by 60% across 50+ services
- Led cloud-native migration on `Google Cloud`, improving scalability 300% and saving $2M annually
- Built CI/CD pipeline with `Cloud Build`, `Terraform`, `GitOps` reducing release cycles to 2 days
```

![Rendered PDF](https://github.com/ocmrz/resum8/raw/main/assets/rendered.png)

## Get Started

### Option 1: Use the CLI (recommended)

```bash
npm install -g resum8

m8 john-doe.md                 # -> john-doe.pdf
m8 john-doe.md --style formal  # Use a specific style
m8 john-doe.md --html --word   # Render to HTML and Word
```

### Option 2: Just grab a stylesheet

Want to use your preferred tooling? Download a stylesheet and use it directly.

- [classic.css](styles/classic.css) — Elegant serif, traditional feel
- [formal.css](styles/formal.css) — Clean, professional
- [minimal.css](styles/minimal.css) — Modern, minimal

```bash
# With Pandoc
pandoc resume.md --pdf-engine=weasyprint -c classic.css -o resume.pdf

# With md-to-pdf
md-to-pdf resume.md --stylesheet classic.css

# With mdpdf
mdpdf resume.md --style classic.css

# Or other tools...
```

## Writing Your Resume

Write your resume in standard markdown syntax. Use `[text](#right)` to right-align text.

```markdown
# Jane Doe

> [jane@example.com](mailto:jane@example.com) | [linkedin.com/in/janedoe](https://linkedin.com/in/janedoe) | [github.com/janedoe](https://github.com/janedoe)

## Experience

### Acme Corp [Jan 2022 - Present](#right)
*Senior Software Engineer*  [San Francisco, CA](#right)

- Built REST API serving 10k requests/min using `Node.js` and `Redis`
- Led team of 10 engineers to deliver project on time
```

- Use a blockquote (`>`) with pipe-separated links
- The `[text](#right)` link floats right via CSS—use it for dates and locations.

See the [full syntax reference](docs/syntax.md) for tables, skills sections, and enhanced Pandoc features.

## CLI Commands

| Command | Description |
|---------|-------------|
| `m8 <file>` | Render to PDF (default) |
| `m8 <file> --html` | Render to HTML |
| `m8 <file> --word` | Render to Word (.docx) |
| `m8 <file> --all` | Render all formats |
| `m8 <file> -w` | Watch mode (auto-rebuild) |
| `m8 <file> -s <style>` | Use specific style |
| `m8 init [filename]` | Create resume from template (default: resume.md) |
| `m8 eject [style]` | Copy style to ./styles/ for customization |
| `m8 style` | List available styles |
| `m8 style -d <name>` | Set default style |

### Examples

```bash
m8 resume.md                 # → output/resume.pdf
m8 resume.md --html          # → output/resume.html
m8 resume.md --all           # → all formats
m8 resume.md --watch         # watch mode
m8 resume.md --style formal  # use formal style
m8 resume.md --output cv     # → output/cv.pdf
```

### CSS Variable Customization

Override CSS variables without ejecting:

```bash
m8 resume.md --var font-family="Arial"
m8 resume.md --var section-header-color="#0066cc"
```

Or create `resum8.config.json`:

```json
{
  "style": "formal",
  "variables": {
    "font-family": "Inter, sans-serif",
    "section-header-color": "#2563eb"
  }
}
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
- [Pandoc](https://pandoc.org/)
- [WeasyPrint](https://weasyprint.org/)

```bash
# macOS
brew install pandoc weasyprint
```

**For stylesheet-only:** Any markdown-to-HTML/PDF tool that supports custom CSS.

## License

MIT
