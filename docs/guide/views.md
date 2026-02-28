# Views

[Tags](/guide/tags) filter your content. Views configure how the filtered content renders: which sections appear, in what order, what keywords to inject, how many pages to target. See [How Tailoring Works](/guide/tailoring) for the mental model.

## Four Kinds of View

Every render uses a view. They differ in where they live and how much effort they take to create.

| Kind                               | Where                             | Nature                                    |
| ---------------------------------- | --------------------------------- | ----------------------------------------- |
| [Default view](#default-view)      | Frontmatter render fields         | Base config for all renders               |
| [Tag view](#tag-views)             | Frontmatter `tags:` expanded form | Per-tag overrides, implicit for every tag |
| [Custom view](#custom-views)       | `.view.yaml` files                | Per-application config                    |
| [Ephemeral view](#ephemeral-views) | CLI flags                         | One-off, not persisted                    |

Tag views and custom views are peers, not a hierarchy. `--for` resolves to one or the other, never both. See [Cascade Order](#cascade-order) for details.

## Default View

Frontmatter render fields (`pages`, `style`, `vars`, `layout`, `bullet-order`) are the default view. They apply to every render unless overridden by a more specific view.

```yaml
---
pages: 1
style:
  accent-color: '#2563eb'
vars:
  tagline: 'Full-stack engineer with 8 years of experience'
---
```

A resume with no frontmatter still has a default view, it just uses built-in defaults for everything.

## Tag Views

Every [tag](/guide/tags) implicitly generates a tag view. With no configuration, the tag view inherits all defaults from the [default view](#default-view). You can configure the tag view using the expanded form in frontmatter:

```yaml
---
tags:
  frontend:
    layout: [experience, skills, projects]
    pages: 1

  fullstack:
    extends: [frontend, backend]
    layout: [experience, skills, projects, education]
    pages: 2
---
```

The shorthand `fullstack: [frontend, backend]` is sugar for `fullstack: { extends: [frontend, backend] }`. Use the expanded form when you need render configuration on the tag view.

Configuring a tag view doesn't change the tag. Other tags can still compose it, `{.@frontend}` still works in the body. The tag handles content (what to show), its tag view handles rendering (how to show it).

## Custom Views

Custom views live in `.view.yaml` files. Top-level keys are view names:

```yaml
# stripe.view.yaml
stripe-swe:
  selects: [backend, distributed-systems, leadership]
  layout: [experience, skills, projects]
  vars:
    tagline: 'Stream Processing, Event-Driven Architecture, Go, Kafka'

stripe-pm:
  selects: [frontend, leadership]
  vars:
    tagline: 'Product Strategy, Cross-functional Leadership'
```

Resumx recursively discovers all `**/*.view.yaml` files relative to the resume. Organize however you want:

```
resume.md
stripe-swe.view.yaml
views/
  active/
    netflix.view.yaml
  archive/
    old-google.view.yaml
```

Render with `--for`:

```bash
resumx resume.md --for stripe-swe
```

::: info View resolution
`--for` resolves the name against both custom views and tag views. If a name matches both, Resumx raises an error. Glob patterns (--for 'stripe-\*') match against all named views (tag and custom). See [CLI Reference](/guide/cli-reference) for the full list of `--for` patterns.
:::

## Custom View Fields

| Field          | Type                     | Description                                                                                   |
| -------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `selects`      | `string[]`               | Content tags to include (union).                                                              |
| `layout`       | `string[]`               | Section whitelist and ordering ([`data-section`](/guide/semantic-selectors#sections) values). |
| `pages`        | `number`                 | Target page count (overrides frontmatter).                                                    |
| `bullet-order` | `source` \| `tag`        | Bullet ordering strategy. Default: `source`.                                                  |
| `vars`         | `Record<string, string>` | Variable values for <code v-pre>{{ }}</code> placeholders.                                    |
| `style`        | `Record<string, string>` | Style overrides (same as frontmatter `style`).                                                |
| `format`       | `string`                 | Output format (`pdf`, `html`, `docx`, `png`).                                                 |
| `output`       | `string`                 | Output path (same as frontmatter `output`).                                                   |

Base defaults (pages, style, bullet-order) live in frontmatter. Custom view fields are overrides.

### Content Filtering

A custom view without `selects` applies no content filter. All content renders, tagged or not. This is useful when a view only needs render configuration:

```yaml
one-pager:
  layout: [experience, skills]
  pages: 1
```

An explicit empty array (`selects: []`) is different: it means "select no tags," so only untagged content appears. Tagged content is stripped. Think of it like a SQL query: omitting the WHERE clause returns everything, while `WHERE tag IN ()` matches nothing.

```yaml
generic:
  selects: [] # only untagged (common) content
  pages: 1
```

| Definition                     | Behavior                            |
| ------------------------------ | ----------------------------------- |
| No `selects`                   | All content (no filter)             |
| `selects: [frontend, backend]` | Untagged + `@frontend` + `@backend` |
| `selects: []`                  | Untagged content only               |

## Variables

Tags filter content. Variables inject new per-application text into <code v-pre>{{ }}</code> placeholders:

```markdown
# Jane Doe

jane@example.com | github.com/jane

{{ tagline }}
```

```yaml
# stripe-swe.view.yaml
stripe-swe:
  selects: [backend]
  vars:
    tagline: 'Backend engineer specializing in stream processing'
```

When defined, the value renders in place. When undefined, the placeholder produces nothing (no blank space). Variable values can contain markdown formatting (e.g. `**bold**`), which is rendered normally since substitution happens before markdown parsing.

Defining a variable with no matching <code v-pre>{{ }}</code> placeholder is an error.

Variables resolve in order: ephemeral view (CLI `-v`) > tag view or custom view `vars` > default view `vars`.

## Layout

`layout` controls which sections appear and in what order. Unlisted sections are excluded. The header always renders.

```yaml
backend-role:
  selects: [backend]
  layout: [experience, skills, projects, education]
```

## Bullet Order

`bullet-order` controls how bullets are arranged within each section.

| Value    | Behavior                                                                              |
| -------- | ------------------------------------------------------------------------------------- |
| `source` | Document order, as written in markdown. **(default)**                                 |
| `tag`    | Tagged bullets first, ordered by `selects` priority. Untagged follow in source order. |

Given:

```markdown
- Led team of 5 engineers to deliver project 2 weeks early
- Designed event-driven microservices handling 2M events/day {.@distributed-systems}
- Built REST APIs with OpenAPI documentation {.@backend}
```

With `bullet-order: tag` and `selects: [backend, distributed-systems]`:

```markdown
- Built REST APIs with OpenAPI documentation {.@backend}
- Designed event-driven microservices handling 2M events/day {.@distributed-systems}
- Led team of 5 engineers to deliver project 2 weeks early
```

The recruiter's 7.4-second scan hits the most relevant content first, without rearranging anything in the source file.

## Ephemeral Views

CLI flags like `-v`, `--layout`, `--pages`, `--bullet-order`, and `-s` define a view inline without persisting it. Useful for quick iteration, scripting, and CI pipelines:

```bash
resumx resume.md --for backend -v tagline="Stream Processing, Go" --layout experience,skills -o stripe.pdf
```

This is functionally a view with `selects: [backend]`, `vars.tagline`, `layout`, and `output`, it just doesn't live in a file.

## Cascade Order

Views stack in layers, like the CSS cascade. Each layer can override specific fields from the layer below. Fields not set in a layer fall through to the next one down.

```
Built-in defaults
  → Default view (frontmatter render fields)
    → Tag view OR Custom view (whichever --for resolves)
      → Ephemeral view (CLI flags)
```

Tag views and custom views are at the same level. `--for` resolves to exactly one of them, and that view overrides the default view. If the name matches both a tag and a custom view, Resumx raises an error. Ephemeral view (CLI flags) overrides everything.

### How Fields Merge

Not all fields merge the same way. The rule depends on the field's shape:

| Field shape | Fields                                      | Merge rule                                                  |
| ----------- | ------------------------------------------- | ----------------------------------------------------------- |
| Scalar      | `pages`, `bullet-order`, `format`, `output` | Later layer replaces                                        |
| Record      | `vars`, `style`                             | Shallow merge (later keys override, earlier keys preserved) |
| Array       | `selects`, `layout`, `css`                  | Later layer replaces (not concatenated)                     |

For example, if the default view sets `vars: { tagline: "Full-stack engineer", keywords: "React" }` and a custom view sets `vars: { tagline: "Backend engineer" }`, the resolved result is `{ tagline: "Backend engineer", keywords: "React" }`. The custom view's `tagline` overrides, the default view's `keywords` is preserved.

Arrays replace entirely because partial overrides would be ambiguous. `layout: [experience, skills]` means exactly those sections in that order, not "add to whatever was below."

## Batch Rendering

Render all views at once, or use a glob for a subset:

```bash
resumx resume.md --for '*'
resumx resume.md --for 'stripe-*'
```

For parallel rendering, use a Makefile:

```makefile
RESUME = resume.md

stripe: $(RESUME)
	resumx $< --for stripe-swe -o out/stripe.pdf

vercel: $(RESUME)
	resumx $< --for vercel-fe -o out/vercel.pdf

all: stripe vercel
```

`make -j4 all` renders in parallel. Edit a bullet in `resume.md`, run `make all`, and every application updates.
