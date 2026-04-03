![Resumx OG Image](https://github.com/resumx/resumx/raw/HEAD/.github/resumx-og-image.png)

---

<p align="center">
  <a href="https://resumx.dev"><img src="https://img.shields.io/badge/docs-resumx.dev-black" alt="docs"></a>
  <a href="https://www.npmjs.com/package/@resumx/resumx"><img src="https://img.shields.io/badge/npm-@resumx/resumx-blue" alt="npm"></a>
  <a href="https://github.com/resumx/resumx/actions/workflows/ci.yml"><img src="https://github.com/resumx/resumx/actions/workflows/ci.yml/badge.svg?branch=main" alt="build status"></a>
</p>

The resume stack for Claude Code.

<img src="https://raw.githubusercontent.com/resumx/resumx/HEAD/vhs/page-fit-demo.gif" alt="Page Fit Demo" width="600px" />

<h3 align="center"><a href="https://resumx.dev">Get started at resumx.dev →</a></h3>

## Quick Start

```bash
npm install -g @resumx/resumx
npx playwright install chromium
```

```bash
resumx init resume.md     # Generate a template resume
resumx resume.md --watch  # Live preview
```

Add agent skills so Claude Code knows how to work with your resume:

```sh
npx skills add resumx/skills
```

**Already have a resume?** [Import your PDF, DOCX, LaTeX, or JSON Resume in seconds →](https://resumx.dev/#import)

## Learn More

Tailored variants from a single file, git-based application tracking, 30+ style options, multi-language support, and more at **[resumx.dev](https://resumx.dev)**.

## License

[Apache License 2.0](LICENSE)
