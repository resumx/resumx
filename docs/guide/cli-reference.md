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

| Flag                       | Description                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `-t, --theme <name>`       | Theme(s) to use (name or path). Repeatable, comma-separated.                           |
| `-o, --output <value>`     | Output path: name, directory (trailing `/`), or template with `{theme}`/`{role}`.      |
| `-f, --format <name>`      | Output format(s): `pdf`, `html`, `docx`, `png`. Repeatable, comma-separated.           |
| `-s, --style <name=value>` | Override style property. Repeatable.                                                   |
| `-r, --role <name>`        | Generate for specific role(s) only. Repeatable, comma-separated.                       |
| `-l, --lang <tag>`         | Generate for specific language(s) only. Repeatable, comma-separated (BCP 47 tags).     |
| `-p, --pages <number>`     | Target page count. Shrinks to fit; for `1`, also fills remaining space.                |
| `-w, --watch`              | Watch for changes and auto-rebuild.                                                    |
| `--check`                  | Validate only, do not render. Exit code 1 if critical issues found.                    |
| `--no-check`               | Skip validation entirely.                                                              |
| `--strict`                 | Fail if validation has any errors. Blocks render (or exit 1 with `--check`).           |
| `--min-severity <level>`   | Minimum severity to display: `critical`, `warning`, `note`, `bonus`. Default: `bonus`. |

### Examples

```bash
# Basic render to PDF
resumx resume.md

# Use a specific theme
resumx resume.md --theme zurich

# Multiple themes (produces separate PDFs)
resumx resume.md --theme zurich,oxford,seattle

# Custom output name
resumx resume.md --output John_Doe_Resume

# Output with template variables
resumx resume.md --output "dist/John_Doe-{theme}" --theme zurich,oxford

# Override style properties
resumx resume.md --style font-family="Inter, sans-serif" --style accent-color="#2563eb"

# Multiple formats
resumx resume.md --format pdf,html,docx

# Fit to 1 page (shrink + fill)
resumx resume.md --pages 1

# Watch mode
resumx resume.md --watch

# Filter by role
resumx resume.md --role frontend

# Combine options
resumx resume.md --theme zurich --role frontend,backend --format pdf,html,docx --watch

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

Some CLI options can also be set in the resume's YAML or TOML frontmatter. CLI flags always take precedence over frontmatter values. Note that `--format` and `--role` are CLI-only options and cannot be set in frontmatter.

```yaml
---
themes: zurich
pages: 1
output: ./dist/John_Doe-{theme}
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
---
```

See the [Frontmatter Reference](/guide/frontmatter-reference) for the full list of fields, types, defaults, and validation options.

## Output Naming

When no `-o` flag or `output` frontmatter is set, filenames are automatically determined:

| Scenario                  | Output                       |
| ------------------------- | ---------------------------- |
| 1 theme, no roles         | `resume.pdf`                 |
| 1 theme, with roles       | `resume-frontend.pdf`        |
| Multiple themes, no roles | `resume-zurich.pdf`          |
| Multiple themes + roles   | `frontend/resume-zurich.pdf` |

For custom naming, use the `-o` flag with template variables:

```bash
# Template with theme variable
resumx resume.md -o "John_Doe-{theme}" --theme zurich,oxford
# → John_Doe-zurich.pdf, John_Doe-oxford.pdf

# Template with role and theme
resumx resume.md -o "{role}/John_Doe-{theme}" --theme zurich,oxford --role frontend,backend
# → frontend/John_Doe-zurich.pdf, backend/John_Doe-oxford.pdf, etc.
```

See the [Frontmatter Reference](/guide/frontmatter-reference#output) for full details on template variables and modes.
