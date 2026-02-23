# Codebase Dependency Graph

Agents can view the dependency graph `deps.svg` to understand the codebase structure and analyze module dependencies.

# Test-driven development

## Running tests

This project uses Playwright with Chromium for PDF rendering tests. Running tests requires disabling the sandbox (`required_permissions: ["all"]`) so Playwright can launch the browser.

After you finish a set of changes and before yielding back to the user, you should:

- Run `npm run lint` to ensure the code compiles
- Run affected tests using `npm run test:related -- <source files you changed>` instead of `npm run test` (which runs the entire suite). This uses Vite's module graph to find and run only test files that transitively import the changed source files.
  - Example: if you changed `src/lib/dom-processors/shared/dom.ts` and `src/lib/dom-processors/wrap-entries/index.ts`, run:
    `npm run test:related -- src/lib/dom-processors/shared/dom.ts src/lib/dom-processors/wrap-entries/index.ts`
  - You can also use `npm run test:changed` which runs tests related to all uncommitted git changes (useful as a final check).
- If the related test run passes but you want extra confidence, you can run the full suite with `npm run test`.
- Under very few circumstances should you run only a specific test file directly (e.g., `npx vitest run path/to/test.ts`) without using `--related` or `--changed`. Prefer `vitest related` or `npm run test:changed` to ensure you catch regressions in dependent modules.
