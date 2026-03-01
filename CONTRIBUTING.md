# Contributing to Resumx

Thanks for your interest in contributing. This guide covers how to get involved, what we accept, and how to set up a development environment.

## Contributor License Agreement

All contributors must sign the [Contributor License Agreement](.github/CLA.md) before their first pull request can be merged. When you open a PR, a bot will ask you to sign by leaving a comment. This is a one-time process.

The CLA grants the Resumx project maintainers a license to use your contribution in any context, including commercial products. You retain full ownership of your code.

## What We Accept

**Yes, please:**

- Bug fixes with a test that reproduces the issue
- Documentation improvements, typo fixes, and clarifications
- Performance improvements with before/after benchmarks
- Test coverage for untested code paths

**Open an issue first:**

- New features, themes, or CLI flags
- Changes to the Markdown syntax or frontmatter schema
- Refactors that touch multiple modules
- Anything that changes the public API

We may close unsolicited feature PRs if they don't align with the project direction. Opening an issue first saves everyone time.

**Not accepted:**

- Changes that introduce runtime dependencies without discussion
- AI-generated bulk PRs without meaningful human review

## Development Setup

### Prerequisites

- Node.js >= 20
- Python 3.x with `pdf2docx` (for DOCX export tests)

### Getting Started

```bash
git clone https://github.com/resumx/resumx.git
cd resumx
npm install
```

Playwright's Chromium browser installs automatically via `postinstall`. If it doesn't, run:

```bash
npx playwright install chromium
```

### Commands

| Command                           | What it does                               |
| --------------------------------- | ------------------------------------------ |
| `npm run build`                   | Compile TypeScript                         |
| `npm run lint`                    | Type-check without emitting                |
| `npm run test`                    | Run the full test suite                    |
| `npm run test:related -- <files>` | Run tests related to specific source files |
| `npm run test:changed`            | Run tests related to uncommitted changes   |
| `npm run dev`                     | Watch mode for TypeScript compilation      |
| `npm run format`                  | Format with Prettier                       |
| `npm run format:check`            | Check formatting without writing           |

### Running Tests

Tests use Vitest and Playwright for PDF rendering assertions. The full suite takes a few minutes because it launches a real browser.

When working on a specific area, use `test:related` to run only the tests that import your changed files:

```bash
npm run test:related -- src/core/frontmatter.ts src/core/html-generator.ts
```

Before submitting a PR, run the full suite:

```bash
npm run test
```

## Pull Request Process

1. Fork the repo and create a branch from `main`.
2. Make your changes. Write tests for new behavior or bug fixes.
3. Run `npm run lint` and `npm run test` locally. Both must pass.
4. Run `npm run format` to ensure consistent formatting.
5. Open a PR with a clear description of what changed and why.
6. Sign the CLA when prompted by the bot.
7. Wait for CI and a maintainer review.

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for custom page sizes
fix: correct date parsing for partial dates
docs: clarify frontmatter schema in README
test: add coverage for section arrangement edge case
refactor: extract CSS variable resolution into separate module
```

### Code Style

- TypeScript, no explicit `any` types
- Prettier handles formatting (runs automatically via lint-staged on commit)
- Keep imports at the top of the file, no inline imports
- Write readable, testable code with clear function boundaries
- Avoid comments that just narrate what the code does

## Reporting Bugs

Open an issue with:

- A minimal Markdown file that reproduces the problem
- Expected vs. actual output
- Your Node.js version (`node -v`) and OS
- The resumx version (`resumx --version`)

## Security Issues

If you discover a security vulnerability, please report it privately via [GitHub's security advisory feature](https://github.com/resumx/resumx/security/advisories/new) rather than opening a public issue.

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE), subject to the terms of the [CLA](.github/CLA.md).
