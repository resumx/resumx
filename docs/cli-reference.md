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

1. Frontmatter `outputName` (if present)
2. The first `# H1` heading (e.g. `# Jane Smith` produces `Jane_Smith.pdf`)
3. If neither exists, use `-o` to specify the output name

`--watch` is not available with stdin input.

### Options

| Flag                       | Description                                                                  |
| -------------------------- | ---------------------------------------------------------------------------- |
| `-t, --theme <name>`       | Theme(s) to use. Repeatable, comma-separated.                                |
| `-o, --output <name>`      | Output filename (without extension) or directory path.                       |
| `-f, --format <name>`      | Output format(s): `pdf`, `html`, `docx`, `png`. Repeatable, comma-separated. |
| `-s, --style <name=value>` | Override style property. Repeatable.                                         |
| `--role <name>`            | Generate for specific role(s) only. Repeatable, comma-separated.             |
| `-w, --watch`              | Watch for changes and auto-rebuild.                                          |

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

# Override style properties
resumx resume.md --style font-family="Inter, sans-serif" --style accent-color="#2563eb"

# Multiple formats
resumx resume.md --format pdf,html,docx

# Watch mode
resumx resume.md --watch

# Filter by role
resumx resume.md --role frontend

# Combine options
resumx resume.md --theme zurich --role frontend,backend --format pdf,html,docx --watch
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

## eject

Copy a bundled theme to `./themes/` for local customization.

```bash
resumx eject [theme]
```

| Argument | Default         | Description                         |
| -------- | --------------- | ----------------------------------- |
| `theme`  | _(interactive)_ | Name of the bundled theme to eject. |

| Flag      | Description                     |
| --------- | ------------------------------- |
| `--force` | Overwrite existing local theme. |

Once ejected, the local copy in `./themes/` takes precedence over the bundled version. Edit it freely.

### Examples

```bash
resumx eject zurich         # Copy zurich.css to ./themes/
resumx eject zurich         # Copy zurich.css to ./themes/
resumx eject zurich --force # Overwrite existing local copy
```

## theme

List available themes, view theme details, or manage theme defaults.

```bash
resumx theme [name]
```

### Subcommands

**List all themes:**

```bash
resumx theme
```

Shows all available themes (bundled and local), indicating which are local overrides.

**View theme info:**

```bash
resumx theme zurich
```

Shows the theme's CSS variables and their current values.

**Set default theme:**

```bash
resumx theme --default zurich
```

| Flag                   | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `-d, --default <name>` | Set the global default theme.                         |
| `--set <name=value>`   | Set a default style override for a theme. Repeatable. |
| `-r, --reset <name>`   | Reset a specific theme style to its default.          |
| `--reset-all`          | Reset all theme style overrides.                      |

### Examples

```bash
# Set global default
resumx theme --default zurich

# Set persistent style overrides
resumx theme zurich --set font-family="Inter, sans-serif"
resumx theme zurich --set accent-color="#2563eb"

# Reset a style
resumx theme zurich --reset font-family

# Reset all overrides
resumx theme zurich --reset-all
```

## validate

Validate resume structure and content.

```bash
resumx validate [file]
```

| Argument | Default     | Description              |
| -------- | ----------- | ------------------------ |
| `file`   | `resume.md` | Resume file to validate. |

| Flag                     | Description                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `--strict`               | Exit with error code if any issues are found.                                          |
| `--min-severity <level>` | Minimum severity to display: `critical`, `warning`, `note`, `bonus`. Default: `bonus`. |

### Examples

```bash
resumx validate                           # Validate resume.md
resumx validate my-resume.md              # Validate specific file
resumx validate --strict                  # Fail on any issue (for CI)
resumx validate --min-severity warning    # Hide notes and bonuses
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

All CLI options can be set in the resume's YAML frontmatter:

```yaml
---
themes: zurich # Theme name(s)
outputName: John_Doe_Resume # Output filename (no extension)
outputDir: ./dist # Output directory
formats: [pdf, html] # Output formats (pdf, html, docx, png)
roles: [frontend, backend] # Roles to generate
style: # Style property overrides
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
---
```

TOML frontmatter (`+++` delimited) is also supported:

```toml
+++
themes = "zurich"
outputName = "John_Doe_Resume"
formats = ["pdf", "html"]

[style]
font-family = "Inter, sans-serif"
accent-color = "#2563eb"
+++
```

## Global Configuration

Global settings are stored in `~/.config/resumx/config.json`:

```json
{
	"defaultTheme": "zurich",
	"themeStyles": {
		"zurich": {
			"font-family": "Inter, sans-serif"
		}
	}
}
```

Manage via the `theme` command rather than editing directly.

The config directory can be overridden with the `RESUMX_CONFIG_DIR` environment variable.

## Output Naming

Output filenames are automatically determined:

| Scenario                  | Output                       |
| ------------------------- | ---------------------------- |
| 1 theme, no roles         | `resume.pdf`                 |
| 1 theme, with roles       | `resume-frontend.pdf`        |
| Multiple themes, no roles | `resume-zurich.pdf`          |
| Multiple themes + roles   | `frontend/resume-zurich.pdf` |
