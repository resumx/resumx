# Markdown Syntax

Resumx uses standard [Markdown](https://www.markdownguide.org/basic-syntax/) with a few extensions. This page covers the syntax that Resumx supports and how it renders in your resume.

## Headings

`h1` is your name. `h2` starts a section. `h3` starts an entry within a section. `h4`-`h6` have no special meaning.

```markdown
# John Doe

## Experience

### Google
```

## Inline Formatting

| Syntax                  | Result                               |
| ----------------------- | ------------------------------------ |
| `**Bold**`              | **Bold**                             |
| `_Italic_`              | _Italic_                             |
| `**_Bold and italic_**` | **_Bold and italic_**                |
| `` `Code` ``            | `Code` (renders as tech tags/badges) |
| `==Highlight==`         | Highlighted text                     |
| `H~2~O`                 | H₂O (subscript)                      |
| `E = mc^2^`             | E = mc² (superscript)                |
| `--`                    | – (en-dash)                          |
| `---`                   | — (em-dash)                          |
| `"text"`                | "text" (smart quotes)                |
| `...`                   | … (ellipsis)                         |

## Definition Lists

A term followed by one or more `: value` lines. The term renders as a bold label, and the values are laid out inline on the same line.

```markdown
Languages
: JavaScript, TypeScript, Python, SQL

Frameworks
: React, Node.js, Express, FastAPI
```

Also useful as inline metadata below an entry heading:

```markdown
### Google [June 2022 – Present]{.right}

Senior Software Engineer
: Infrastructure Platform Team
: San Francisco, CA
```

## Tables

Use `:` in the separator row to align columns: `:---` left (default), `:---:` center, `---:` right.

```markdown
| Category   |           Technologies |
| :--------- | ---------------------: |
| Languages  | Python, TypeScript, Go |
| Frameworks | React, FastAPI, Django |
```

## Comments

HTML comments are stripped from output:

```markdown
- GPA: 3.8/4.0
<!-- - This line will not appear -->
- Dean's List (2018-2022)
```

## Horizontal Rule

A horizontal rule (`---`) splits the resume into a two-column layout. See [Themes > Spacing](/themes#spacing) for column variables and [Custom CSS](/custom-css#creating-a-theme) for enabling or disabling it.
