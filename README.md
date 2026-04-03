![Resumx OG Image](https://github.com/resumx/resumx/raw/HEAD/.github/resumx-og-image.png)

<p align="center">
  <a href="https://resumx.dev"><strong>Read the Docs 📖</strong></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@resumx/resumx"><img src="https://img.shields.io/badge/npm-@resumx/resumx-blue" alt="npm"></a>
  <a href="https://github.com/resumx/resumx/actions/workflows/ci.yml"><img src="https://github.com/resumx/resumx/actions/workflows/ci.yml/badge.svg?branch=main" alt="build status"></a>
</p>

## Documentation

Visit [resumx.dev](https://resumx.dev) to get started.

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

## License

[Apache License 2.0](LICENSE)
