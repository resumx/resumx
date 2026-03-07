![Resumx OG Image](https://github.com/resumx/resumx/raw/HEAD/.github/resumx-og-image.png)

---

<p align="center">
  <em>Resume builder for engineers.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@resumx/resumx"><img src="https://img.shields.io/npm/v/@resumx/resumx?color=blue" alt="npm version"></a>
  <a href="https://github.com/resumx/resumx/actions/workflows/ci.yml"><img src="https://github.com/resumx/resumx/actions/workflows/ci.yml/badge.svg?branch=main" alt="build status"></a>
</p>

Most resume effort goes to layout and styling, the factors that matter least for getting hired. Resumx automates all of it so you can focus on content and tailoring instead.

- **Add or remove content freely, it always fits the page count you set**

  <img src="https://raw.githubusercontent.com/resumx/resumx/HEAD/vhs/page-fit-demo.gif" alt="Page Fit Demo" width="600px" />

- **Your resume is a database. Each application is a query.** Tailoring becomes trivial when it's a filter, not a new file.

  <img src="https://raw.githubusercontent.com/resumx/resumx/HEAD/vhs/cli-demo.gif" alt="Multiple Role Demo" width="600px" />

- **30+ style options, built-in <img src=".github/tailwindcss-logo.svg" alt="Tailwind CSS Logo" width="15" height="11"> Tailwind CSS, 200k+ icon shortcodes.** Mix and match to create your own look.

  <table>
    <tr>
      <td align="center">
        <a href="https://github.com/resumx/resumx/blob/HEAD/gallery/pdf/seattle.pdf">
          <img src="https://github.com/resumx/resumx/raw/HEAD/gallery/png/seattle.png" alt="Seattle" />
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/resumx/resumx/blob/HEAD/gallery/pdf/oxford.pdf">
          <img src="https://github.com/resumx/resumx/raw/HEAD/gallery/png/oxford.png" alt="Oxford" />
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/resumx/resumx/blob/HEAD/gallery/pdf/zurich.pdf">
          <img src="https://github.com/resumx/resumx/raw/HEAD/gallery/png/zurich.png" alt="Zurich" />
        </a>
      </td>
    </tr>
  </table>

- **Git as your application tracker.** `git tag` to mark, `git resumx` to render.

  <img src="https://raw.githubusercontent.com/resumx/resumx/HEAD/vhs/git-version-demo.gif" alt="Git Version Demo" width="600px" />

- **Built for AI editors.** Plain text with agent skills. No integration needed.
- **Markdown in, schema out.** Write plain Markdown. The [schema is inferred](https://resumx.dev/guide/semantic-selectors.html).
- **PDF, HTML, DOCX, and PNG** from a single source.
- **Multi-language, variables, live preview, and more.**

## Quick Start

**Install:**

```bash
npm install -g @resumx/resumx
npx playwright install chromium

# For DOCX export, install pdf2docx:
pip install pdf2docx
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

## The Resume Playbook

Research-backed guidance on what actually moves the needle in hiring, from resume length to tailoring strategy. Read [The Resume Playbook](https://resumx.dev/playbook/resume-length.html).

## CLI

See the full [CLI Reference](https://resumx.dev/guide/cli-reference.html).

## License

[Apache License 2.0](LICENSE)
