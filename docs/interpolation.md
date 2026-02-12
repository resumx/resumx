# Interpolation

::: warning EXPERIMENTAL
The interpolation syntax and behavior are experimental and subject to change in future versions.
:::

Resumx supports interpolation using the <code v-pre>{{ }}</code> syntax. Expressions are evaluated during rendering and replaced with their result.

## Basic Syntax

```markdown
{{ expression }}
```

Any JavaScript expression is valid:

```markdown
{{ new Date().getFullYear() }}
{{ 5 + 3 }}
{{ ['a', 'b', 'c'].join(', ') }}
```

## Practical Example

Auto-calculate years of experience:

```markdown
- **Experience:** {{ new Date().getFullYear() - 2018 }}+ years in software engineering
```

This renders as "8+ years" and updates automatically each year.

## Accessing Frontmatter

All frontmatter properties are accessible inside expressions:

```markdown
---
output: John_Doe_Resume
style:
  company: Google
---

# Resume for {{ output }}

Applying to {{ style.company }}
```

## Environment Variables

Access environment variables via the `env` object:

```markdown
{{ env.USER }}
{{ env.HOME }}
```

## Shell Commands

Use the <code v-pre>{{! }}</code> shorthand to execute shell commands:

```markdown
Last commit: {{! git log -1 --format="%h" }}
Built on: {{! date +%Y-%m-%d }}
```

This is equivalent to using the `exec()` function:

```markdown
{{ exec('git log -1 --format="%h"') }}
```

## Async Support

Expressions automatically await Promise results:

```markdown
{{ fetch('https://api.example.com/data').then(r => r.json()).then(d => d.name) }}
```

## Complex Expressions

Use IIFEs (Immediately Invoked Function Expressions) for multi-statement logic:

```markdown
{{ (() => { const years = new Date().getFullYear() - 2018; return years > 5 ? 'senior' : 'mid-level'; })() }}
```

## Error Handling

If an expression fails to evaluate:

- It returns an empty string
- An error is logged to the console
- The rest of the document continues rendering normally
