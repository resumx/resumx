# 多語言輸出 (Multi-Language Output)

在單一履歷檔案中編寫多種語言的內容。使用 `{lang=xx}` 標記文字，Resumx 就會為每種語言產生獨立的輸出檔案，就像[客製化變體](/guide/tags)一樣，只是專門用於語言。

```markdown /{lang=en}/ /{lang=fr}/
## [Experience]{lang=en} [Expérience]{lang=fr}

### Google

- [Reduced API latency by 60%]{lang=en}
  [Réduction de la latence API de 60%]{lang=fr}
- React, Node.js, PostgreSQL, Redis, Docker
```

這會產生兩個 PDF 檔案。沒有帶 `{lang=...}` 的內容會同時出現在兩者中：

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

::: info 為什麼使用 `lang` 屬性，而不是像 `{.lang:en}` 這樣的類別？
與標籤不同，`lang` 是[標準的 HTML 全域屬性](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang)。Resumx 直接使用它，因此輸出的內容是有效且具無障礙特性的 HTML。
:::

## 標記內容

`lang` 屬性適用於 Resumx 中任何可以使用屬性的地方 — [括號區塊、元素屬性及圍欄區塊](/guide/classes-and-ids)。括號區塊能處理大部分情況：

```markdown
## [Experience]{lang=en} [Expérience professionnelle]{lang=fr}

### Google

- Reduced API latency by 60% {lang=en}
- Réduction de la latence API de 60% {lang=fr}
- React, Node.js, PostgreSQL, Redis, Docker
```

對於內容完全不同的大型區塊，請使用[圍欄區塊 (fenced divs)](/guide/classes-and-ids#fenced-divs)：

<!-- prettier-ignore -->
```markdown
::: {lang=fr}
- Moyenne cumulative : 3.82
- Cours avancés : Systèmes distribués, Algorithmes
:::
```

## 與標籤結合

`{lang=xx}` 和 `{.@name}` 會獨立運作。在這裡，`[text]{lang=en}` 和 `[text]{lang=fr}` 各自的作用範圍僅限於它們的 span，而沒有括號的 `{.@backend}` 是一個[元素屬性](/guide/classes-and-ids#element-attributes)，它會套用於整個列點。

```markdown
- [Designed REST APIs with OpenAPI spec]{lang=en} [Conception d'API REST avec OpenAPI]{lang=fr} {.@backend}
```

為了可讀性將其拆分成多行 — Markdown 會將它們合併為同一個列點：

```markdown
- [Designed REST APIs with OpenAPI spec]{lang=en}
  [Conception d'API REST avec OpenAPI]{lang=fr}
  {.@backend}
```

如果分成獨立的列點，每個都是獨立的元素，因此兩者都需要加上標籤：

```markdown /{.@backend}/ /{lang=en}/ /{lang=fr}/
- Designed REST APIs with OpenAPI spec {lang=en .@backend}
- Conception d'API REST avec OpenAPI {lang=fr .@backend}
```

## 語言標籤

`{lang=xx}` 中的值是 [BCP 47](https://www.w3.org/International/articles/language-tags/) 語言標籤 — 與 HTML [`lang`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang) 屬性使用的標準相同：

| 標籤    | 語言              |
| ------- | ----------------- |
| `en`    | 英文              |
| `fr`    | 法文              |
| `fr-CA` | 法文 (加拿大)     |
| `de`    | 德文              |
| `es`    | 西班牙文          |
| `zh-TW` | 中文 (繁體，台灣) |
| `zh-CN` | 中文 (簡體，中國) |
| `ja`    | 日文              |
| `ko`    | 韓文              |
| `pt-BR` | 葡萄牙文 (巴西)   |
| `ar`    | 阿拉伯文          |

預設情況下，Resumx 會發現內容中所有的 `{lang=xx}` 值，並為每個值產生獨立的輸出。使用 CLI 標籤 `--lang` 來限制要產生哪些語言：

```bash
resumx render resume.md --lang en        # 僅限英文
resumx render resume.md --lang en,fr     # 英文與法文
```

語言會與標籤和格式結合。例如，2 種語言 × 2 個標籤 = **4 份 PDF**。每個維度只有在具有多個值時，才會包含在檔名中：`resume-frontend-en.pdf`、`resume-backend-fr.pdf` 等。
