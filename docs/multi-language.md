# Multi-Language Output

Write one resume file with content in multiple languages. Tag text with `{lang=xx}` and Resumx generates a separate output for each language — just like [per-role output](/per-role-output), but for languages.

```markdown /{lang=en}/ /{lang=fr}/
## [Experience]{lang=en} [Expérience]{lang=fr}

### Google

- [Reduced API latency by 60%]{lang=en}
  [Réduction de la latence API de 60%]{lang=fr}
- React, Node.js, PostgreSQL, Redis, Docker
```

That produces two PDFs. Content without `{lang=...}` appears in both:

::: code-group

```markdown [en]
## Experience

### Google

- Reduced API latency by 60%
- React, Node.js, PostgreSQL, Redis, Docker
```

```markdown [fr]
## Expérience

### Google

- Réduction de la latence API de 60%
- React, Node.js, PostgreSQL, Redis, Docker
```

:::

::: info Why `lang` attribute, not a class like `{.lang:en}`?
Unlike roles, `lang` is a [standard HTML global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang). Resumx uses it directly so the output is valid, accessible HTML.
:::

## Tagging Content

The `lang` attribute works everywhere attributes work in Resumx — [bracketed spans, element attributes, and fenced divs](/classes-and-ids). Bracketed spans handle most cases:

```markdown
## [Experience]{lang=en} [Expérience professionnelle]{lang=fr}

### Google

- Reduced API latency by 60% {lang=en}
- Réduction de la latence API de 60% {lang=fr}
- React, Node.js, PostgreSQL, Redis, Docker
```

For large blocks where everything differs, use [fenced divs](/classes-and-ids#fenced-divs):

<!-- prettier-ignore -->
```markdown
::: {lang=fr}
- Moyenne cumulative : 3.82
- Cours avancés : Systèmes distribués, Algorithmes
:::
```

## Combining with Roles

`{lang=xx}` and `{.role:name}` work independently. Here, `[text]{lang=en}` and `[text]{lang=fr}` each scope to their span, while `{.role:backend}` without brackets is an [element attribute](/classes-and-ids#element-attributes) that applies to the whole bullet.

```markdown
- [Designed REST APIs with OpenAPI spec]{lang=en} [Conception d'API REST avec OpenAPI]{lang=fr} {.role:backend}
```

Break into multiple lines for readability — Markdown collapses them into the same bullet:

```markdown
- [Designed REST APIs with OpenAPI spec]{lang=en}
  [Conception d'API REST avec OpenAPI]{lang=fr}
  {.role:backend}
```

With separate bullets, each is its own element, so both need the role:

```markdown /{.role:backend}/ /{lang=en}/ /{lang=fr}/
- Designed REST APIs with OpenAPI spec {lang=en .role:backend}
- Conception d'API REST avec OpenAPI {lang=fr .role:backend}
```

## Language Tags

Values in `{lang=xx}` are [BCP 47](https://www.w3.org/International/articles/language-tags/) language tags — the same standard used by the HTML [`lang`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang) attribute:

| Tag     | Language                      |
| ------- | ----------------------------- |
| `en`    | English                       |
| `fr`    | French                        |
| `fr-CA` | French (Canada)               |
| `de`    | German                        |
| `es`    | Spanish                       |
| `zh-TW` | Chinese (Traditional, Taiwan) |
| `zh-CN` | Chinese (Simplified, China)   |
| `ja`    | Japanese                      |
| `ko`    | Korean                        |
| `pt-BR` | Portuguese (Brazil)           |
| `ar`    | Arabic                        |

By default, Resumx discovers all `{lang=xx}` values in your content and generates a separate output for each. Use the `langs` frontmatter field or the `--lang` CLI flag to limit which languages get generated:

```yaml
---
langs: [en] # Only generate the English version
---
```

```bash
resumx render resume.md --lang en
```

Langs combines with roles, themes, and formats. For example, 2 langs × 2 roles × 2 themes = **8 PDFs**. Output files include the language tag: `resume-en-frontend-zurich.pdf`, `resume-fr-backend-oxford.pdf`, etc.
