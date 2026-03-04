# Resumx

Resumx is a CLI that renders resumes from Markdown to PDF, HTML, and DOCX. Users write their resume in a single `.md` file with optional YAML frontmatter, and the renderer handles page fitting, styling, target-specific filtering, and multi-language output.

View the dependency graph in `deps.svg` to understand module structure.

## Philosophy

Resume builders overwhelmingly optimize for styling and theming, the factor with the least impact on whether a candidate gets hired. The actual value breakdown looks closer to:

| Factor                                                            | Hiring impact | Typical user effort |
| ----------------------------------------------------------------- | ------------- | ------------------- |
| Content quality (wording, quantified achievements, value framing) | ~50%          | ~15%                |
| Tailoring for the specific job description                        | ~25%          | ~5%                 |
| Layout and page fitting                                           | ~15%          | ~15%                |
| Styling and theming                                               | ~10%          | ~65%                |

Effort is almost perfectly inverted from value. Users keep tweaking themes and layouts, mistaking activity for progress.

Resumx is built on four bets:

1. **Zero time on low-value work.** Layout, page fitting, and styling should cost the user nothing. The layout is opinionated, research-backed (ATS-friendly, optimized for the 7.4-second recruiter scan), and not configurable beyond minor CSS overrides. Auto page fitting means content never breaks the layout regardless of how much you add or remove.

2. **Make tailoring trivial.** [Research shows](docs/playbook/tailored-vs-generic.md) tailored resumes get 10.6x higher interview rates, yet most people skip it because it means duplicating files and re-fighting layout for every variant. Target variants in a single Markdown file eliminate that friction entirely.

3. **AI-native by format.** Markdown is the ideal format for AI collaboration: no proprietary schema, no GUI state, no context loss. An AI can read, edit, and generate variants from a single file. The long-term direction is agents that find jobs, create target variants, and produce tailored resumes automatically.

4. **Opinionated by default.** Users waste time on choices that don't affect hiring outcomes. Resumx removes those choices. Layout, typography, and structure follow established best practices for tech-adjacent industries (software, finance, consulting). The user's only job is writing great content.

## Ground Rules

- Keep the README, docs, and skill file (under skills/) in sync with any functionality change.

## Design Principles

> Declarative. Readable. Semantic. Progressive. Restrained.

1. **Declarative over imperative.** The user describes what their resume contains, not how to render it. Configuration lives in frontmatter, not in scripts or build files.
2. **Readable source over terse syntax.** A plain `cat resume.md` should read like a resume. Standard Markdown renders as expected, extensions are additive, never transformative. Readability comes from predictability, consistency, and visual distinctness of keywords (e.g. `{.@frontend}` is more scannable than `{.role:frontend}` because the `@` stands out), not shortest syntax.
3. **Semantic over presentational.** Markdown describes what things are (sections, entries, skills), CSS decides how they look. Tailwind classes are an opt-in escape hatch, not a requirement.
4. **Convention over configuration.** Auto-discover what you can, use sensible defaults, only add a setting when convention genuinely can't cover the use case.
5. **Progressive complexity.** A bare markdown file with zero frontmatter should produce a good-looking PDF. Advanced features layer on without complicating the simple path.
6. **Markdown is the source of truth.** Frontmatter configures the render, it doesn't define the resume.
7. **Restraint.** When principles conflict, do less. Explicit beats implicit for expensive or surprising operations.

## Development Workflow

- Optimize icons after adding or modifying them: `pnpm run optimize-icons -- assets/icons assets/icons`
- Run `pnpm run lint` to ensure the code compiles before yielding back to the user.

### Testing

This project uses Playwright with Chromium for PDF rendering tests, so launching the browser requires disabling the sandbox (`required_permissions: ["all"]`).

The full suite is slow because of Playwright. Prefer running only affected tests to keep the feedback loop fast:

- **`pnpm run test:related -- <source files>`** runs only test files that transitively import the changed sources via Vite's module graph. Example: `pnpm run test:related -- src/lib/dom-processors/shared/dom.ts src/lib/dom-processors/wrap-entries/index.ts`
- **`pnpm run test:changed`** does the same but auto-detects from uncommitted git changes. Good as a final check.
- **`pnpm run test`** runs the entire suite. Use when `test:related` passes but you want full confidence.
- Avoid running a specific test file directly (e.g., `pnpm exec vitest run path/to/test.ts`). It won't catch regressions in dependent modules that `test:related` would.
