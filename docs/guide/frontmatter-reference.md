# Frontmatter Reference

Configure rendering options directly inside your resume using YAML or TOML frontmatter. CLI flags take precedence over frontmatter values.

## Syntax

### YAML

```yaml
---
pages: 1
output: ./dist/John_Doe-{view}
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
---
```

### TOML

```toml
+++
pages = 1
output = "./dist/John_Doe-{view}"

[style]
font-family = "Inter, sans-serif"
accent-color = "#2563eb"
+++
```

YAML uses `---` delimiters; TOML uses `+++`. Both are fully supported, pick whichever you prefer.

## Render Fields (Default View)

These fields form the [default view](/guide/views#default-view), the base render configuration that applies to every render. Tag views, custom views, and ephemeral views override these values.

### `css`

Path(s) to custom CSS file(s) to load in addition to the default styles. When multiple files are specified, they are loaded in order.

| Property     | Value                        |
| ------------ | ---------------------------- |
| **Type**     | `string` or `string[]`       |
| **Default**  | None (uses built-in default) |
| **CLI flag** | `--css <path>`               |

A single string is automatically normalized to a one-element array.

**Priority:** CLI > frontmatter.

```yaml
# Single CSS file
css: my-styles.css

# Multiple CSS files
css: [base.css, overrides.css]
```

### `output`

Output path for rendered files. Supports three modes depending on its value:

| Property     | Value                                                        |
| ------------ | ------------------------------------------------------------ |
| **Type**     | `string`                                                     |
| **Default**  | Input filename stem in cwd (e.g. `resume.md` → `resume.pdf`) |
| **CLI flag** | `-o, --output <value>`                                       |

**Modes:**

| Value                           | Mode       | Behavior                                                                      |
| ------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `./dist/`                       | Directory  | Ends with `/`, output files go into this directory using default naming rules |
| `John_Doe`                      | Plain name | No `{…}`, used as the base filename, with automatic tag/lang suffixes         |
| `./dist/John_Doe-{view}-{lang}` | Template   | Contains `{view}` and/or `{lang}`, expanded for each combination              |

**Template variables:**

- `{view}` — the tag or view name (e.g. `frontend`, `stripe-swe`). Expands to empty string when rendering without `--for`; orphaned separators are cleaned up automatically.
- `{lang}` — the language tag (e.g. `en`, `fr`). Expands to empty string when no languages exist.

When using template mode, if the expanded paths would produce duplicate filenames, an error is raised with a suggestion.

```yaml
# Plain name, produces John_Doe.pdf
output: John_Doe

# Directory, uses default name in ./dist/
output: ./dist/

# Template, produces ./dist/John_Doe-frontend.pdf, etc.
output: ./dist/John_Doe-{view}

# Template with both, produces frontend/John_Doe-en.pdf, etc.
output: "{view}/John_Doe-{lang}"

# Path with directory and name
output: ./dist/John_Doe
```

### `pages`

Target page count. When set, Resumx automatically adjusts style options (gaps, line-height, font-size, margins) to fit your resume within the specified number of pages.

| Property     | Value              |
| ------------ | ------------------ |
| **Type**     | positive integer   |
| **Default**  | No page clamping   |
| **CLI flag** | `--pages <number>` |

**Behavior:**

- **Shrink to fit**: Progressively reduces spacing, line-height, font-size, and margins through a four-phase waterfall until content fits within the target page count. Adjustments stop as soon as the target is reached — no more is changed than necessary.
- **Single-page fill** (`pages: 1` only): If content fits on one page with room to spare, gaps are expanded (up to 1.5× their original value) to fill the page. This only applies to single-page resumes where bottom whitespace looks unintentional.
- **Readability minimums**: Variables are never reduced below safe minimums (e.g. font-size: 9pt, line-height: 1.15, section-gap: 4px). If content cannot fit even at minimums, the resume renders as-is with a warning.

The shrinking phases apply in order of visual impact (least noticeable first):

1. **Gaps** — row-gap, entry-gap, section-gap
2. **Line height** — unitless line-height ratio
3. **Font size** — in points
4. **Margins** — page-margin-x and page-margin-y (last resort)

**Priority:** CLI > frontmatter.

```yaml
# Fit resume to exactly 1 page (shrink + fill)
pages: 1

# Fit resume to at most 2 pages (shrink only)
pages: 2
```

::: tip
`style:` values are treated as **starting points** when `pages:` is set. The clamping engine may reduce them toward global minimums. If you want strict style control without any automatic adjustments, don't use `pages:`.
:::

See [Fit to Page](/guide/fit-to-page) for the full guide.

### `bullet-order`

Controls how bullets are ordered within each section when rendering with tags or views.

| Property    | Value             |
| ----------- | ----------------- |
| **Type**    | `source` \| `tag` |
| **Default** | `source`          |

**Values:**

| Value    | Behavior                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------- |
| `source` | Document order, as written in markdown                                                                  |
| `tag`    | Tagged bullets first, ordered by `extends`/`selects` priority. Untagged bullets follow in source order. |

Set as a base default to apply to all views, or override per-view.

```yaml
bullet-order: tag
```

See [Views: Bullet Order](/guide/views#bullet-order) for the full guide.

### `tags`

Tag composition and [tag view](/guide/views#tag-views) configuration. Define composed tags as unions of constituent tags, and optionally configure their implicit tag view. When rendering for a composed tag, content tagged with any constituent is included. Use `--for <name>` to render a tag view.

| Property    | Value                                   |
| ----------- | --------------------------------------- |
| **Type**    | `Record<string, string[] \| TagConfig>` |
| **Default** | No composed tags                        |

**Shorthand** (composition only):

```yaml
tags:
  fullstack: [frontend, backend]
  tech-lead: [backend, leadership]
  startup-cto: [fullstack, leadership, architecture]
```

**Expanded** (composition + tag view config):

```yaml
tags:
  frontend:
    layout: [experience, skills, projects]
    pages: 1

  fullstack:
    extends: [frontend, backend]
    layout: [experience, skills, projects, education]
    pages: 2
```

The shorthand `fullstack: [frontend, backend]` is sugar for `fullstack: { extends: [frontend, backend] }`.

Compositions can reference other composed tags (recursive expansion). Circular references produce an error.

See [Tags](/guide/tags) for tagging syntax, composition, and tag views. See [Views](/guide/views) for custom views and ephemeral views.

### `vars`

Template variables that can be referenced in the resume body with <code v-pre>{{ name }}</code> syntax. Variables provide a way to inject per-application content (taglines, keyword lines) without editing the resume body.

| Property     | Value                    |
| ------------ | ------------------------ |
| **Type**     | `Record<string, string>` |
| **Default**  | No variables             |
| **CLI flag** | `-v, --var <key=value>`  |

Variables defined here serve as base defaults. They can be overridden by [view](/guide/views) `vars` or CLI `-v` flags.

**Priority:** CLI > view > frontmatter.

```yaml
vars:
  tagline: 'Full-stack engineer with 8 years of experience'
  keywords: ''
```

In the resume body:

```markdown
{{ tagline }}
```

When a variable is undefined or empty, the <code v-pre>{{ }}</code> placeholder produces nothing (the line is removed from output). Variable values can contain markdown formatting, which is rendered normally.

Defining a variable with no matching placeholder in the document is an error.

See [Views: Variables](/guide/views#variables) for the full guide.

### `icons`

Custom icon definitions. Keys are icon slugs usable with `:slug:` syntax; values are SVG strings, URLs, or base64 data URIs.

| Property    | Value                    |
| ----------- | ------------------------ |
| **Type**    | `Record<string, string>` |
| **Default** | No custom icons          |

Frontmatter icons override built-in and Iconify icons with the same slug.

```yaml
icons:
  mycompany: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
  partner: 'https://example.com/partner-logo.svg'
  badge: 'data:image/svg+xml;base64,PHN2Zz4uLi48L3N2Zz4='
```

See [Icons](/guide/icons#custom-icons) for details.

### `extra`

Arbitrary user-defined data. Use this for any custom fields that aren't part of the built-in schema (e.g. name, target role, company). Values can be strings, numbers, booleans, arrays, or nested objects.

| Property    | Value                     |
| ----------- | ------------------------- |
| **Type**    | `Record<string, unknown>` |
| **Default** | No custom data            |

Unknown top-level fields are rejected with an error. `extra` is the only place for custom data.

```yaml
extra:
  name: Jane Smith
  target-role: Senior SWE
  companies:
    - Acme Corp
    - Globex
```

```toml
[extra]
name = "Jane Smith"
target-role = "Senior SWE"
companies = ["Acme Corp", "Globex"]
```

### `style`

Style overrides applied on top of the defaults. Keys map to `--key` in the generated CSS (e.g. `font-family` -> `--font-family`).

| Property     | Value                      |
| ------------ | -------------------------- |
| **Type**     | `Record<string, string>`   |
| **Default**  | No overrides               |
| **CLI flag** | `-s, --style <name=value>` |

**Priority:** CLI > frontmatter

```yaml
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
  font-size: '10pt'
```

See the [Style Options](/guide/style-options#options-reference) reference for the full list.

## Validate Fields

These fields configure validation (run by default before rendering, or standalone with `--check`). They are placed under a `validate` key and are separate from the render fields above.

### `validate.extends`

Base validation preset to use.

| Property    | Value                                      |
| ----------- | ------------------------------------------ |
| **Type**    | `string`                                   |
| **Default** | `recommended`                              |
| **Allowed** | `recommended`, `minimal`, `strict`, `none` |

**Presets:**

| Preset        | Rules included                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `recommended` | `missing-name`, `missing-contact`, `no-sections`, `no-entries`, `empty-bullet`, `long-bullet`, `single-bullet-section` |
| `minimal`     | `missing-name`, `missing-contact`, `no-sections`, `no-entries`, `empty-bullet`                                         |
| `strict`      | Same rules as `recommended` (all rules run at their default severities)                                                |
| `none`        | No rules — validation is effectively disabled                                                                          |

### `validate.rules`

Per-rule severity overrides. Set any rule to a severity level or `off` to disable it.

| Property       | Value                                         |
| -------------- | --------------------------------------------- |
| **Type**       | `Record<string, Severity \| 'off'>`           |
| **Severities** | `critical`, `warning`, `note`, `bonus`, `off` |

```yaml
validate:
  extends: recommended
  rules:
    long-bullet: warning # Downgrade from critical
    single-bullet-section: off # Disable entirely
```

### Available Rules

| Rule                     | Default Severity     | Description                                                |
| ------------------------ | -------------------- | ---------------------------------------------------------- |
| `missing-name`           | `critical`           | Resume must have an H1 heading (your name).                |
| `missing-contact`        | `critical`           | Resume must have contact info (email or phone) after name. |
| `no-sections`            | `critical`           | Resume must have at least one H2 section.                  |
| `no-entries`             | `warning`            | Resume should have at least one H3 entry.                  |
| `empty-bullet`           | `critical`           | List items must have text content.                         |
| `long-bullet`            | `critical`/`warning` | Bullet exceeds character length threshold.                 |
| `single-bullet-section`  | `bonus`              | Section has only one bullet point.                         |
| `unknown-fenced-div-tag` | `warning`            | Named fenced div uses an unrecognized HTML tag name.       |

### Full Example

```yaml
---
pages: 1
output: ./out/Jane_Smith-{view}
bullet-order: source
style:
  accent-color: '#0ea5e9'
tags:
  fullstack: [frontend, backend]
  leadership: false
vars:
  tagline: 'Full-stack engineer with 8 years of experience'
validate:
  extends: recommended
  rules:
    long-bullet: warning
    single-bullet-section: off
extra:
  name: Jane Smith
  target-role: Senior SWE
---
```

Custom views are defined in external `.view.yaml` files. Tag views are configured inline under `tags:`. See [Views](/guide/views) for the full guide.

## Field Precedence

For fields that can be set in multiple places, the resolution order is:

| Priority    | Source                                       |
| ----------- | -------------------------------------------- |
| 1 (highest) | Ephemeral view (CLI flags)                   |
| 2           | Tag view OR custom view (whichever resolves) |
| 3           | Default view (frontmatter render fields)     |
| 4 (lowest)  | Built-in defaults                            |

## Unknown Fields

Any top-level frontmatter key not in the known set (`css`, `output`, `pages`, `bullet-order`, `style`, `icons`, `tags`, `vars`, `validate`, `extra`) produces an error:

```
Unknown frontmatter field 'foo'. Use 'extra' for custom fields.
```

If the unknown field looks like a typo of a known field, a more specific suggestion is shown:

```
Unknown frontmatter field 'page'. Did you mean 'pages'?
```

To store custom data, use the [`extra`](#extra) field.
