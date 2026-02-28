# CLI Reference

The Resumx CLI is invoked with `resumx`. Running `resumx --help` shows all commands and options.

[[toc]]

## Render (Default)

Render a Markdown resume to PDF, HTML, PNG, or DOCX.

```bash
resumx <file>
```

If no file is specified, defaults to `resume.md`.

### Reading from stdin

Resumx can read Markdown from standard input, enabling piping from other commands:

```bash
cat resume.md | resumx                          # Auto-detects piped stdin
cat resume.md | resumx --format html            # Stdin with options
echo "# Quick Resume" | resumx -               # Explicit - argument
git show HEAD~3:resume.md | resumx -o old       # Render from a past commit
```

When reading from stdin, the output filename is derived from:

1. Frontmatter `output` (if present)
2. The first `# H1` heading (e.g. `# Jane Smith` produces `Jane_Smith.pdf`)
3. If neither exists, use `-o` to specify the output name

`--watch` is not available with stdin input.

### Options

| Flag                       | Description                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `--css <path>`             | Path to custom CSS file. Repeatable, comma-separated.                                                |
| `-o, --output <value>`     | Output path: name, directory (trailing `/`), or template with `{target}`/`{lang}`.                   |
| `-f, --format <name>`      | Output format(s): `pdf`, `html`, `docx`, `png`. Repeatable, comma-separated.                         |
| `-s, --style <name=value>` | Override style property. Repeatable.                                                                 |
| `-l, --lang <tag>`         | Generate for specific language(s) only. Repeatable, comma-separated (BCP 47 tags).                   |
| `-p, --pages <number>`     | Target page count. Shrinks to fit; for `1`, also fills remaining space.                              |
| `--for <name-or-glob>`     | Tag view name, custom view name, glob pattern, or file path. See [Views](/guide/views).              |
| `-v, --var <key=value>`    | Override a template variable. Repeatable.                                                            |
| `--layout <list>`          | Section whitelist and ordering (comma-separated [`data-section`](/guide/semantic-selectors) values). |
| `--bullet-order <value>`   | Bullet ordering: `source` (default) or `tag`. See [Views](/guide/views#bullet-order).                |
| `-w, --watch`              | Watch for changes and auto-rebuild.                                                                  |
| `--check`                  | Validate only, do not render. Exit code 1 if critical issues found.                                  |
| `--no-check`               | Skip validation entirely.                                                                            |
| `--strict`                 | Fail if validation has any errors. Blocks render (or exit 1 with `--check`).                         |
| `--min-severity <level>`   | Minimum severity to display: `critical`, `warning`, `note`, `bonus`. Default: `bonus`.               |

### Examples

```bash
# Basic render to PDF
resumx resume.md

# Custom CSS file
resumx resume.md --css my-styles.css

# Custom output name
resumx resume.md --output John_Doe_Resume

# Override style properties
resumx resume.md --style font-family="Inter, sans-serif" --style accent-color="#2563eb"

# Multiple formats
resumx resume.md --format pdf,html,docx

# Fit to 1 page (shrink + fill)
resumx resume.md --pages 1

# Watch mode
resumx resume.md --watch

# Render a custom view
resumx resume.md --for stripe-swe

# Render a tag (uses implicit tag view)
resumx resume.md --for frontend

# Render all views matching a glob
resumx resume.md --for 'stripe-*'

# Render all discovered custom views
resumx resume.md --for '*'

# Use a custom view file
resumx resume.md --for ./tmp/stripe.view.yaml

# Override variables
resumx resume.md --for stripe-swe -v tagline="Stream Processing, Go, Kafka"

# Section whitelist and ordering
resumx resume.md --layout experience,skills,projects

# Ephemeral view (no file modification)
resumx resume.md --for backend -v tagline="Stream Processing, Go" --layout experience,skills -o stripe.pdf

# Validate only (no render)
resumx resume.md --check

# Render without validation
resumx resume.md --no-check

# Strict mode: validate, render only if clean
resumx resume.md --strict

# Filter validation output
resumx resume.md --check --min-severity warning
```

## init

Create a new resume from the starter template.

```bash
resumx init [filename]
```

| Argument   | Default     | Description                   |
| ---------- | ----------- | ----------------------------- |
| `filename` | `resume.md` | Name for the new resume file. |

| Flag      | Description                                |
| --------- | ------------------------------------------ |
| `--force` | Overwrite existing file without prompting. |

### Examples

```bash
resumx init                    # Creates resume.md
resumx init my-resume.md       # Creates my-resume.md
resumx init resume.md --force  # Overwrite if exists
```

## Output Formats

| Format | Flag                     | Notes                                                               |
| ------ | ------------------------ | ------------------------------------------------------------------- |
| PDF    | `--format pdf` (default) | Rendered via Chromium, A4 page size                                 |
| HTML   | `--format html`          | Standalone file with embedded CSS                                   |
| PNG    | `--format png`           | A4 viewport (794 × 1123 px)                                         |
| DOCX   | `--format docx`          | Via PDF intermediate — requires `pdf2docx` (`pip install pdf2docx`) |

Formats can be comma-separated: `--format pdf,html,docx`.

## Frontmatter Configuration

Some CLI options can also be set in the resume's YAML or TOML frontmatter, or in [views](/guide/views). CLI flags form an [ephemeral view](/guide/views#ephemeral-views) that overrides the active tag view or custom view, which overrides the [default view](/guide/views#default-view) (frontmatter render fields).

```yaml
---
pages: 1
output: ./dist/John_Doe-{target}
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
---
```

See the [Frontmatter Reference](/guide/frontmatter-reference) for the full list of fields, types, defaults, and validation options.

## Output Naming

When no `-o` flag or `output` frontmatter is set, filenames are automatically determined:

| Scenario          | Output                   |
| ----------------- | ------------------------ |
| No view, no langs | `resume.pdf`             |
| With tag/view     | `resume-frontend.pdf`    |
| With langs        | `resume-en.pdf`          |
| Tag/view + langs  | `frontend/resume-en.pdf` |

For custom naming, use the `-o` flag with template variables:

```bash
# Template with tag/view name variable
resumx resume.md -o "John_Doe-{target}" --for frontend
# → John_Doe-frontend.pdf

# Template with tag/view and lang
resumx resume.md -o "{target}/John_Doe-{lang}" --for frontend --lang en,fr
# → frontend/John_Doe-en.pdf, frontend/John_Doe-fr.pdf
```

See the [Frontmatter Reference](/guide/frontmatter-reference#output) for full details on template variables and modes.
