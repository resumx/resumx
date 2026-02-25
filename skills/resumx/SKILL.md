---
name: resumx
description: Work with Resumx, a Markdown-to-PDF resume renderer. Use when creating, editing, converting, building, styling, or tailoring resumes. Covers syntax, CLI, style options, icons, per-role output, multi-language, page fitting, validation, custom CSS, JSON Resume conversion, and AI-assisted resume writing.
---

# Resumx

Resumx (**Resu**me **M**arkdown e**X**pression) renders resumes from Markdown to PDF, HTML, PNG, and DOCX. It auto-fits content to a target page count, supports per-role and multi-language output from a single source file, and uses style options for styling.

## Resources

This skill includes reference documents for specific workflows. Read them when applicable:

| Resource                                                           | When to use                                                                                   |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| [json-resume-to-markdown.md](resources/json-resume-to-markdown.md) | Converting between Resumx Markdown and JSON Resume format (either direction)                  |
| [writing-resume.md](resources/writing-resume.md)                   | Interactive resume creation, guiding users step-by-step to collect info and generate a resume |

## Markdown Syntax

Standard Markdown with one extension: `{.right}` for right-alignment.

### Structure

| Element  | Syntax                                                         |
| -------- | -------------------------------------------------------------- |
| Name     | `# Full Name`                                                  |
| Contact  | `> [phone](tel:...) \| [email](mailto:...) \| [linkedin](url)` |
| Section  | `## Section Name`                                              |
| Entry    | `### Title [Date]{.right}`                                     |
| Subtitle | `_Role or Degree_`                                             |
| Bullets  | `- Achievement with \`tech\` tags`                             |
| Skills   | Definition list (`Term` + `: values`)                          |

### Inline Columns

`||` splits a line into columns, pushing them to opposite sides. Simplest way to right-align a date or location:

```markdown
### Google || Jan 2020 - Present

_Senior Software Engineer_ || San Francisco, CA
```

More than two columns: `A || B || C`. Escape with `\||`.

### Inline Formatting

| Syntax          | Result            |
| --------------- | ----------------- |
| `**Bold**`      | Bold              |
| `_Italic_`      | Italic            |
| `` `Code` ``    | Tech tag/badge    |
| `==Highlight==` | Highlighted text  |
| `H~2~O`         | Subscript         |
| `E = mc^2^`     | Superscript       |
| `--` / `---`    | En-dash / Em-dash |
| `"text"`        | Smart quotes      |

### Definition Lists

```markdown
Languages
: JavaScript, TypeScript, Python

Frameworks
: React, Node.js, Express
```

Also used as inline metadata below entries:

```markdown
### Google [June 2022 - Present]{.right}

Senior Software Engineer
: Infrastructure Platform Team
: San Francisco, CA
```

### Tables

```markdown
| Category  |           Technologies |
| :-------- | ---------------------: |
| Languages | Python, TypeScript, Go |
```

### Horizontal Rule

`---` splits content into a two-column layout. Everything above becomes the primary column, everything below the secondary.

### Comments

HTML comments (`<!-- -->`) are stripped from output.

## Classes, IDs & Fenced Divs

### Bracketed Spans

`[text]{.class}` wraps text in a `<span>` with classes/IDs/attributes:

```markdown
### Google [2022 - Present]{.right}

_Senior Software Engineer_ [San Francisco, CA]{.right}
```

### Element Attributes

`{...}` at end of a block element applies to the whole element:

```markdown
- Built interactive dashboards {.@frontend}
```

### Fenced Divs

`:::` applies attributes to block content. Single child: attributes go directly on it (no wrapper div). Multiple children: auto-wraps in a `<div>`.

```markdown
::: {.grid .grid-cols-3}

- JavaScript
- TypeScript
- Python
  :::
```

Prefix a tag name for a specific HTML element: `::: footer {.text-center}`.

## Frontmatter

YAML (`---`) or TOML (`+++`). CLI flags always override frontmatter.

### Render Fields

| Field    | Type                       | Default             | Description                                                                |
| -------- | -------------------------- | ------------------- | -------------------------------------------------------------------------- |
| `css`    | `string \| string[]`       | None                | Path(s) to custom CSS file(s)                                              |
| `output` | `string`                   | Input filename stem | Output path (name, directory with `/`, or template with `{role}`/`{lang}`) |
| `pages`  | `positive integer`         | No clamping         | Target page count                                                          |
| `style`  | `Record<string, string>`   | No overrides        | Style option overrides                                                     |
| `roles`  | `Record<string, string[]>` | No composed roles   | Role composition map (composed name -> constituent roles)                  |
| `icons`  | `Record<string, string>`   | No custom icons     | Custom icon definitions (SVG, URL, or base64)                              |
| `extra`  | `Record<string, unknown>`  | No custom data      | Arbitrary user-defined data                                                |

### Validate Fields

Under a `validate` key:

| Field              | Type                                | Default             |
| ------------------ | ----------------------------------- | ------------------- |
| `validate.extends` | `string`                            | `recommended`       |
| `validate.rules`   | `Record<string, Severity \| 'off'>` | Per-preset defaults |

Presets: `recommended`, `minimal`, `strict`, `none`.

Available rules: `missing-name`, `missing-contact`, `no-sections`, `no-entries`, `empty-bullet`, `long-bullet`, `single-bullet-section`, `unknown-fenced-div-tag`.

### Unknown Fields

Unknown top-level keys error. Use `extra` for custom data.

### Full Example

```yaml
---
pages: 1
output: ./out/Jane_Smith-{role}
style:
  accent-color: '#0ea5e9'
validate:
  extends: recommended
  rules:
    long-bullet: warning
extra:
  name: Jane Smith
  target-role: Senior SWE
---
```

## CLI

```bash
resumx <file>              # Render (defaults to resume.md, PDF)
resumx init [filename]     # Create template resume
```

### Render Options

| Flag                       | Description                                |
| -------------------------- | ------------------------------------------ |
| `--css <path>`             | Path to custom CSS file, repeatable        |
| `-o, --output <value>`     | Output path (name, directory, or template) |
| `-f, --format <name>`      | `pdf`, `html`, `docx`, `png`, repeatable   |
| `-s, --style <name=value>` | Override style property, repeatable        |
| `-r, --role <name>`        | Role filter, repeatable                    |
| `-l, --lang <tag>`         | Language filter (BCP 47), repeatable       |
| `-p, --pages <number>`     | Target page count                          |
| `-w, --watch`              | Auto-rebuild on changes                    |
| `--check`                  | Validate only, no render                   |
| `--no-check`               | Skip validation                            |
| `--strict`                 | Fail on any validation error               |
| `--min-severity <level>`   | Filter validation output                   |

### Stdin

```bash
cat resume.md | resumx
git show HEAD~3:resume.md | resumx -o old
```

### Output Naming

| Scenario           | Output                   |
| ------------------ | ------------------------ |
| No roles, no langs | `resume.pdf`             |
| With roles         | `resume-frontend.pdf`    |
| With langs         | `resume-en.pdf`          |
| Roles + langs      | `frontend/resume-en.pdf` |

Template variables: `{role}`, `{lang}`.

## Style Options

Override via frontmatter `style:` or CLI `--style`.

**Typography:** `font-family`, `title-font-family`, `content-font-family`, `font-size` (default `11pt`), `line-height` (default `1.35`).

**Colors:** `text-color`, `muted-color`, `accent-color`, `link-color`, `background-color`.

**Headings:** `name-size`, `name-caps` (`normal`, `small-caps`, `all-small-caps`), `name-weight`, `name-style`, `section-title-size`, `section-title-caps`, `section-title-weight`, `section-header-color`, `section-border`, `header-text-align`, `section-header-align`, `entry-title-size`, `entry-title-weight`.

**Links:** `link-underline` (`underline`, `none`).

**Spacing:** `page-margin-x`, `page-margin-y`, `section-gap`, `entry-gap`, `bullet-gap`, `data-row-gap`, `data-col-gap`, `list-indent`, `two-col-widths`, `two-col-gap`, `two-col-template`.

**Lists:** `bullet-style` (`disc`, `circle`, `square`, `none`).

**Features:** `icons` (`inline`, `none`).

### Custom CSS

Create a CSS file importing common base modules:

```css
@import 'common/base.css';
@import 'common/icons.css';
@import 'common/utilities.css';
@import 'common/two-column.css';

:root {
	--font-family: 'Inter', sans-serif;
	--accent-color: #2563eb;
}
```

Reference by path: `css: my-styles.css` or `--css my-styles.css`.

Common modules: `common/base.css` (reset, typography, layout), `common/icons.css` (icon sizing), `common/utilities.css` (`.small-caps`, `.sr-only`), `common/two-column.css` (two-column grid, omit to disable `---` columns).

## Fit to Page

Set `pages: N` to auto-fit. Shrinks in order of visual impact:

1. **Gaps** (bullet-gap, data-row-gap, entry-gap, section-gap)
2. **Margins** (page-margin-x, page-margin-y)
3. **Typography** (font-size, line-height)

For `pages: 1`, gaps also expand to fill remaining space.

**Minimums:** font-size 9pt, line-height 1.15, section-gap 4px, entry-gap 1px, page-margin-y 0.3in, page-margin-x 0.35in.

When `pages:` is set, `style:` values are starting points that may be reduced. Without `pages:`, they apply as-is.

## Icons

### Syntax

`:icon-name:` for built-in icons, `:set/name:` for Iconify (200k+ icons), standard emoji shortcodes as fallback.

### Auto-Icons

Links to recognized domains get icons automatically:

`mailto:` (Email), `tel:` (Phone), `linkedin.com`, `github.com`, `gitlab.com`, `bitbucket.org`, `stackoverflow.com`, `x.com`/`twitter.com`, `youtube.com`/`youtu.be`, `dribbble.com`, `behance.net`, `medium.com`, `dev.to`, `codepen.io`, `marketplace.visualstudio.com`.

Disable with `style: { icons: none }`.

### Custom Icons (Frontmatter)

```yaml
icons:
  mycompany: '<svg>...</svg>'
  partner: 'https://example.com/logo.svg'
```

Resolver order: Frontmatter > Built-in > Iconify > Emoji.

## Tailwind CSS

Resumx compiles Tailwind CSS v4 on-the-fly. Apply via `{.class}` syntax:

```markdown
[React]{.bg-blue-100 .text-blue-800 .px-2 .rounded}
```

Works with bracketed spans, element attributes, and fenced divs. Supports arbitrary values: `.text-[#ff6600]`.

Built-in utilities: `.small-caps`, `.sr-only`.

## Per-Role Output

Tag content with `{.@name}`. Untagged content always included. Tagged content only appears for matching roles. Multiple roles: `{.@backend .@fullstack}`.

```markdown
- Shared bullet
- Frontend-only bullet {.@frontend}
- Backend-only bullet {.@backend}
```

Resumx auto-discovers all roles and generates a PDF for each. Filter with `--role frontend` or `--role frontend,backend`.

### Role Composition

Define composed roles in frontmatter as unions of constituents:

```yaml
roles:
  fullstack: [frontend, backend]
  startup-cto: [fullstack, leadership, architecture]
```

When rendering for `fullstack`, content tagged `frontend` or `backend` is included. Compositions expand recursively (`startup-cto` includes `frontend` and `backend` via `fullstack`). Composed role names are added to the auto-discovered set.

## Multi-Language Output

Tag content with `{lang=xx}` (BCP 47). Untagged content appears in all languages.

```markdown
## [Experience]{lang=en} [Expérience]{lang=fr}

### Google

- [Reduced API latency by 60%]{lang=en}
  [Réduction de la latence API de 60%]{lang=fr}
```

Combines with roles: `{lang=en .@backend}`. Filter with `--lang en` or `--lang en,fr`.

Dimensions multiply: 2 langs × 2 roles = 4 PDFs.

## Semantic Selectors

Resumx auto-generates semantic HTML attributes for CSS targeting:

**Header:** `[data-field='name']`, `[data-field='email']`, `[data-field='phone']`, `[data-field='profiles']`, `[data-network='github']`, `[data-field='location']`, `[data-field='url']`.

**Sections:** `section[data-section='work']`, `section[data-section='education']`, `section[data-section='skills']`, `section[data-section='projects']`, `section[data-section='awards']`, `section[data-section='certificates']`, `section[data-section='publications']`, `section[data-section='volunteer']`, `section[data-section='languages']`, `section[data-section='interests']`, `section[data-section='references']`, `section[data-section='basics']`.

Headings are classified by fuzzy keyword matching.

**Entries:** `.entries` (container), `.entry` (individual `<article>`).

**Dates:** `<time>` with ISO 8601 `datetime`. `.date-range` wraps start/end `<time>` tags.

## Git Integration

```bash
git resumx sent/stripe-2026-02              # render from tag
git resumx HEAD~3 --css my-styles.css -o stripe  # past commit
git show :resume.md | resumx -o staged      # staged changes
```

Pre-commit hook: `resumx --check` for validation.
Post-commit hook: auto-render on every commit.

## Using AI

Install agent skills: `npx skills add ocmrz/resumx`.

### Tailoring to Job Postings

1. Give the agent `resume.md` and the job posting URL
2. Agent extracts requirements and keywords
3. Maps each to existing bullets (covered, weak, missing)
4. Proposes minimal, truthful edits
5. Run `resumx resume.md` to validate and render

With `pages: 1`, layout auto-adjusts after every edit.

### Resume Template

```markdown
---
pages: 1
---

# Full Name

> [+1 555-123-4567](tel:+15551234567) | [email@example.com](mailto:email@example.com) | [linkedin.com/in/user](https://linkedin.com/in/user)

## Education

### University Name [Sept 2019 - June 2024]{.right}

_Degree Name_

- GPA: 3.85

## Work Experience

### Company Name [Start - End]{.right}

_Job Title - Employment Type_

- Achievement with quantified impact using `Technology`

## Projects

### Project Name _(Individual/Group)_

- Description of what was built

## Technical Skills

Languages
: Java, Python, TypeScript

Frameworks
: React, Node.js, FastAPI
```

### Writing Best Practices

- Start bullets with strong action verbs (Led, Developed, Engineered, Increased)
- Quantify results (20% improvement, 500+ users)
- Wrap technologies in backticks
- Use consistent date formats (`Jan 2020 - Present`)
- Use `\[Date\]` for literal brackets in dates: `[\[Jun 2024\]]{.right}`
