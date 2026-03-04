# 多语言输出

通过编写一份包含多语言内容的简历文件。使用 `{lang=xx}` 标记文本，Resumx 会为每种语言生成单独的输出，就像[定制变体](/guide/tags)一样，只不过是用于语言。

```markdown /{lang=en}/ /{lang=fr}/
## [Experience]{lang=en} [Expérience]{lang=fr}

### Google

- [Reduced API latency by 60%]{lang=en}
  [Réduction de la latence API de 60%]{lang=fr}
- React, Node.js, PostgreSQL, Redis, Docker
```

这将生成两份 PDF。没有附带 `{lang=...}` 的内容会同时出现在两者中：

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

::: info 为什么使用 `lang` 属性，而不是像 `{.lang:en}` 这样的类名？
与 tags 不同，`lang` 是一个[标准的 HTML 全局属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang)。Resumx 直接使用它，从而确保输出的是有效且符合无障碍标准的 HTML。
:::

## 标记内容

`lang` 属性在 Resumx 中任何可以使用属性的地方都有效 —— [方括号内联元素、块级元素属性以及栅栏容器](/guide/classes-and-ids)。方括号内联元素可以处理大多数情况：

```markdown
## [Experience]{lang=en} [Expérience professionnelle]{lang=fr}

### Google

- Reduced API latency by 60% {lang=en}
- Réduction de la latence API de 60% {lang=fr}
- React, Node.js, PostgreSQL, Redis, Docker
```

如果有多行大块内容截然不同，请使用[栅栏容器 (fenced divs)](/guide/classes-and-ids#fenced-divs)：

<!-- prettier-ignore -->
```markdown
::: {lang=fr}
- Moyenne cumulative : 3.82
- Cours avancés : Systèmes distribués, Algorithmes
:::
```

## 与 Tags 结合使用

`{lang=xx}` 和 `{.@name}` 是独立工作的。在这里，`[text]{lang=en}` 和 `[text]{lang=fr}` 的作用域仅限于它们自己的方括号跨度，而不带方括号的 `{.@backend}` 是一个作用于整个要点的[块级元素属性](/guide/classes-and-ids#element-attributes)。

```markdown
- [Designed REST APIs with OpenAPI spec]{lang=en} [Conception d'API REST avec OpenAPI]{lang=fr} {.@backend}
```

为了提高可读性，可以换行书写 —— Markdown 会将它们折叠为同一个要点：

```markdown
- [Designed REST APIs with OpenAPI spec]{lang=en}
  [Conception d'API REST avec OpenAPI]{lang=fr}
  {.@backend}
```

如果是分开的独立要点，每个要点都是它自己的元素，因此都需要带有 tag：

```markdown /{.@backend}/ /{lang=en}/ /{lang=fr}/
- Designed REST APIs with OpenAPI spec {lang=en .@backend}
- Conception d'API REST avec OpenAPI {lang=fr .@backend}
```

## 语言标签

`{lang=xx}` 中的值是 [BCP 47](https://www.w3.org/International/articles/language-tags/) 语言标签 —— 与 HTML [`lang`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang) 属性使用的标准一致：

| 标签    | 语言                                            |
| ------- | ----------------------------------------------- |
| `en`    | 英语 (English)                                  |
| `fr`    | 法语 (French)                                   |
| `fr-CA` | 法语 - 加拿大 (French - Canada)                 |
| `de`    | 德语 (German)                                   |
| `es`    | 西班牙语 (Spanish)                              |
| `zh-TW` | 繁体中文 - 台湾 (Chinese - Traditional, Taiwan) |
| `zh-CN` | 简体中文 - 中国 (Chinese - Simplified, China)   |
| `ja`    | 日语 (Japanese)                                 |
| `ko`    | 韩语 (Korean)                                   |
| `pt-BR` | 葡萄牙语 - 巴西 (Portuguese - Brazil)           |
| `ar`    | 阿拉伯语 (Arabic)                               |

默认情况下，Resumx 会发现你内容中所有的 `{lang=xx}` 值，并为每一个生成独立的输出。使用 `--lang` CLI 标志可以限制生成哪些语言：

```bash
resumx render resume.md --lang en        # 仅生成英文
resumx render resume.md --lang en,fr     # 生成英文和法文
```

语言可以与 tags 和格式结合使用。例如，2 种语言 × 2 种 tags = **4 份 PDF**。只有当某个维度有多个值时，才会包含在文件名中：例如 `resume-frontend-en.pdf`，`resume-backend-fr.pdf` 等。
