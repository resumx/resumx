# Markdown Syntax Reference

## Universal Syntax

These features use standard markdown and work with **any** renderer:

| Element      | Syntax                                     | Notes                     |
| ------------ | ------------------------------------------ | ------------------------- |
| Name         | `# John Doe`                               | H1 heading                |
| Contact      | `> [email](mailto:...) \| [GitHub](url)`   | Blockquote with links     |
| Section      | `## Experience`                            | H2 heading                |
| Entry + Date | `### Company [Jan 2022 - Present](#right)` | Link hack for right-align |
| Subtitle     | `*Senior Engineer*`                        | Italic line after H3      |
| Tech tags    | `` `Python` ``                             | Inline code               |
| Bullets      | `- Built feature X`                        | Unordered list            |
| Skills       | Table (see below)                          | Two-column layout         |

### Right-Alignment

The `[text](#right)` syntax right-aligns content by exploiting markdown's link syntax.

```markdown
### Acme Corp [Jan 2022 - Present](#right)

_Senior Software Engineer_

- Built REST API serving 10k requests/min using `Node.js` and `Redis`
```

### Two-Column Layout (Table)

Tables create a clean two-column key-value layout. Borders are hidden by default (though some styles may show them):

```markdown
## Skills

|            |                         |
| ---------- | ----------------------- |
| Languages  | Python, TypeScript, Go  |
| Frameworks | React, FastAPI, Django  |
| Tools      | Docker, Kubernetes, AWS |
```

First column is the **key/label**, second column is the **value/content**. Empty headers (`| | |`) keep it minimal, or use real headers for clarity:

```markdown
| Category  | Technologies           |
| --------- | ---------------------- |
| Languages | Python, TypeScript, Go |
```

## Enhanced Syntax (Pandoc / CLI)

These features require Pandoc or the resum8 CLI, but offer cleaner source:

### Class Attributes

Cleaner right-alignment using bracketed spans:

```markdown
### Acme Corp [Jan 2022 - Present]{.right}
```

Equivalent to the link hack, but requires `markdown-it-attrs` or Pandoc.

### Definition Lists

More readable skills sections:

```markdown
Languages
: Python, TypeScript, Go

Frameworks
: React, FastAPI, Django
```

Renders as a two-column grid. Only works with Pandoc or compatible parsers.

## Auto-Icons

Links to these domains automatically show icons (via CSS):

| Domain         | Icon     |
| -------------- | -------- |
| `mailto:`      | ✉️ Email |
| `tel:`         | 📞 Phone |
| `linkedin.com` | LinkedIn |
| `github.com`   | GitHub   |
| `youtube.com`  | YouTube  |
