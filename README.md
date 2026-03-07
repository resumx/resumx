![Resumx OG Image](https://raw.githubusercontent.com/resumx/resumx/HEAD/.github/resumx-og-image.png)

---

<p align="center">
  <a href="https://www.npmjs.com/package/@resumx/resumx"><img src="https://img.shields.io/npm/v/@resumx/resumx?color=blue" alt="npm version"></a>
  <a href="https://github.com/resumx/resumx/actions/workflows/ci.yml"><img src="https://github.com/resumx/resumx/actions/workflows/ci.yml/badge.svg?branch=main" alt="build status"></a>
</p>

<p align="center">
  <a href="https://resumx.dev/"><strong>Documentation</strong></a> | 
  <a href="https://resumx.dev/playbook/resume-length.html"><strong>The Resume Playbook</strong></a>
</p>

Tailored resumes get [10x more interviews](https://resumx.dev/playbook/tailored-vs-generic.html), but most people skip it because it means managing multiple files and re-fitting everything to one page. Resumx lets you tailor for every role in a single file, and auto-fits your content to the page count you set

- **Add or remove content freely, it always fits number of pages you set**

  <img src="https://raw.githubusercontent.com/resumx/resumx/HEAD/vhs/page-fit-demo.gif" alt="Page Fit Demo" width="700px" />

- **Tailor for every role in one file**

  <img src="https://raw.githubusercontent.com/resumx/resumx/HEAD/vhs/cli-demo.gif" alt="Multiple Role Demo" width="700px" />

- **30+ style options, built-in <img src=".github/tailwindcss-logo.svg" alt="Tailwind CSS Logo" width="15" height="11"> Tailwind CSS, 200k+ icon shortcodes.**
- **PDF, HTML, DOCX, and PNG** from a single source.
- **Render from any commit or tag**
- **Plain Markdown.** One `.md` file, works with Git, any editor, any AI.
  <!-- prettier-ignore-start -->

  ```markdown
  ---
  pages: 1
  ---

  # Jane Doe

  jane@example.com | github.com/jane | linkedin.com/in/jane

  ## Experience

  ### :meta: Meta || June 2022 - Present

  _Senior Software Engineer_

  - Built distributed systems serving 1M requests/day {.@backend}
  - Built interactive dashboards using :ts: TypeScript {.@frontend}
  ```

  <!-- prettier-ignore-end -->

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

## Documentation

For full documentation, visit [resumx.dev](https://resumx.dev).

## CLI

See the full [CLI Reference](https://resumx.dev/guide/cli-reference.html).

## License

[Apache License 2.0](LICENSE)
