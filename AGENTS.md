# Resumx

Resumx is a CLI that renders resumes from Markdown to PDF, HTML, and DOCX. Users write their resume in a single `.md` file with optional YAML frontmatter, and the renderer handles page fitting, styling, target-specific filtering, and multi-language output.

View the dependency graph in `deps.svg` to understand module structure.

## Ground Rules

- This package has no published release yet, so there are no existing users to protect. When removing or replacing features, just delete the old code. No deprecation notices, no backward compatibility shims.
- Keep the README, docs, and skill file in sync with any functionality change.

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

- Optimize icons after adding or modifying them: `npm run optimize-icons -- assets/icons assets/icons`
- Run `npm run lint` to ensure the code compiles before yielding back to the user.

### Testing

This project uses Playwright with Chromium for PDF rendering tests, so launching the browser requires disabling the sandbox (`required_permissions: ["all"]`).

The full suite is slow because of Playwright. Prefer running only affected tests to keep the feedback loop fast:

- **`npm run test:related -- <source files>`** runs only test files that transitively import the changed sources via Vite's module graph. Example: `npm run test:related -- src/lib/dom-processors/shared/dom.ts src/lib/dom-processors/wrap-entries/index.ts`
- **`npm run test:changed`** does the same but auto-detects from uncommitted git changes. Good as a final check.
- **`npm run test`** runs the entire suite. Use when `test:related` passes but you want full confidence.
- Avoid running a specific test file directly (e.g., `npx vitest run path/to/test.ts`). It won't catch regressions in dependent modules that `test:related` would.
