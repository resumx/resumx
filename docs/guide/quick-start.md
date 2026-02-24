# Quick Start

Get from zero to a rendered resume in under a minute.

## 1. Install

```bash
npm install -g resumx
```

Resumx uses Playwright's Chromium to render PDFs. After installing, run:

```bash
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

## 2. Create and Render

```bash
resumx init resume.md  # Generate a template resume
resumx resume.md       # Render to PDF
```

<!-- TODO: Terminal screenshot showing the output of resumx init and resumx resume.md commands -->

## 3. Edit

Open `resume.md` in your editor and customize it with your information. Run `resumx resume.md` again to re-render, or use `resumx resume.md --watch` to auto-rebuild on every save.

## Next Steps

- Learn how to [Use AI](/guide/using-ai) to tailor your resume to job postings
- See the [Markdown Syntax](/guide/markdown-syntax) reference for all supported elements
- Read [Customizing Your Resume](/guide/customizing-your-resume) when you want to go beyond the defaults
