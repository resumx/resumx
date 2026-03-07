# Frontmatter 参考 (Frontmatter Reference)

通过 YAML 或 TOML 格式的 frontmatter，你可以直接在简历内部配置渲染选项。CLI 标志（Flags）的优先级高于 frontmatter 中的值。

## 语法

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

YAML 使用 `---` 分隔符；TOML 使用 `+++`。两者均被完全支持，你可以选择自己喜欢的格式。

## 渲染字段 (Default View)

这些字段构成了[默认视图](/guide/views#default-view)，也就是应用于每次渲染的基础配置。标签视图（Tag views）、自定义视图（Custom views）以及临时视图（Ephemeral views）可以覆盖这些值。

### `css`

自定义 CSS 文件路径或行内 CSS 字符串。以 `.css` 结尾的条目会被解析为文件路径，其他则视为行内 CSS。行内 CSS 会在基础样式之后以独立的 `<style>` 标签渲染，确保错误隔离。

| 属性         | 值                     |
| ------------ | ---------------------- |
| **类型**     | `string` 或 `string[]` |
| **默认值**   | 无 (使用内置默认样式)  |
| **CLI 标志** | `--css <path>`         |

单个字符串会被自动规范化为单元素数组。

**优先级:** CLI > frontmatter。

```yaml
# 单个 CSS 文件
css: my-styles.css

# 多个 CSS 文件
css: [base.css, overrides.css]

# 行内 CSS (无需额外文件)
css: |
  h2 {
    letter-spacing: 0.05em;
  }

# 混合使用：文件路径 + 行内 CSS
css:
  - base.css
  - |
    h2::after {
      content: '';
      flex: 1;
      border-bottom: var(--section-title-border);
    }
```

不支持 CSS 预处理器文件 (`.less`、`.sass`、`.scss`、`.styl`)。

### `output`

渲染文件的输出路径。根据其值的不同，支持三种模式：

| 属性         | 值                                                           |
| ------------ | ------------------------------------------------------------ |
| **类型**     | `string`                                                     |
| **默认值**   | 当前工作目录下的输入文件名 (例如 `resume.md` → `resume.pdf`) |
| **CLI 标志** | `-o, --output <value>`                                       |

**模式:**

| 值                              | 模式       | 行为                                                         |
| ------------------------------- | ---------- | ------------------------------------------------------------ |
| `./dist/`                       | Directory  | 以 `/` 结尾，输出文件将使用默认命名规则放入该目录            |
| `John_Doe`                      | Plain name | 没有 `{…}`，用作基础文件名，并自动附加标签/语言后缀          |
| `./dist/John_Doe-{view}-{lang}` | Template   | 包含 `{view}`、`{lang}` 和/或 `{format}`，为每种组合进行展开 |

**模板变量:**

- `{view}` — 标签或视图名称（例如 `frontend`、`stripe-swe`）。在没有 `--for` 参数进行渲染时将展开为空字符串；孤立的分隔符将被自动清理。
- `{lang}` — 语言标签（例如 `en`、`fr`）。当不存在语言时，将展开为空字符串。
- `{format}` — 输出格式（例如 `pdf`、`html`）。用于按格式组织输出到不同目录。

当使用模板模式时，如果展开的路径会产生重复的文件名，系统将抛出错误并给出建议。

```yaml
# 纯名称，生成 John_Doe.pdf
output: John_Doe

# 目录，在 ./dist/ 中使用默认名称
output: ./dist/

# 模板，生成 ./dist/John_Doe-frontend.pdf 等
output: ./dist/John_Doe-{view}

# 包含两者的模板，生成 frontend/John_Doe-en.pdf 等
output: "{view}/John_Doe-{lang}"

# 包含目录和名称的路径
output: ./dist/John_Doe
```

### `pages`

目标页数。当设置后，Resumx 会自动调整样式选项（间距、行高、字体大小、边距），以使你的简历适配指定的页数。

| 属性         | 值                 |
| ------------ | ------------------ |
| **类型**     | 正整数             |
| **默认值**   | 不限制页数         |
| **CLI 标志** | `--pages <number>` |

**行为:**

- **收缩以适应 (Shrink to fit)**：通过四个阶段的瀑布流逐步减小间距、行高、字体大小和边距，直到内容适合目标页数。一旦达到目标，调整就会停止 —— 不会做不必要的修改。
- **单页填充 (Single-page fill)**（仅限 `pages: 1`）：如果内容排版在一页内仍有大量剩余空间，则间距会扩大（最多增加至原始值的 1.5 倍）以填满页面。这仅适用于单页简历，避免底部留白显得突兀。
- **最低可读性限制**：变量的值永远不会低于安全最小值（例如 font-size: 9pt, line-height: 1.15, section-gap: 4px）。如果即使在最小值下内容仍无法适应，简历将按原样渲染并发出警告。

收缩阶段按照视觉影响程度依次应用（从最不明显的开始）：

1. **间距 (Gaps)** — row-gap、entry-gap、section-gap
2. **行高 (Line height)** — 无单位的行高比例
3. **字体大小 (Font size)** — 以 pt 为单位
4. **边距 (Margins)** — page-margin-x 和 page-margin-y（作为最后手段）

**优先级:** CLI > frontmatter。

```yaml
# 让简历正好适应 1 页（收缩 + 填充）
pages: 1

# 让简历最多不超过 2 页（仅收缩）
pages: 2
```

::: tip
当设置了 `pages:` 时，`style:` 中的值将被视为 **起点**。限制引擎可能会将它们向全局最小值降低。如果你想要严格控制样式而不希望任何自动调整，请不要使用 `pages:`。
:::

请参阅 [适应页面 (Fit to Page)](/guide/fit-to-page) 获取完整指南。

### `sections`

控制哪些部分显示以及它们的排序方式。包含两个子字段：`hide` 和 `pin`。

| 属性         | 值                                                                 |
| ------------ | ------------------------------------------------------------------ |
| **类型**     | `{ hide?: string[], pin?: string[] }`                              |
| **默认值**   | 源文件顺序的所有部分                                               |
| **CLI 标志** | `--hide <sections>`, `--pin <sections>` (逗号分隔)                 |
| **可选值**   | [`data-section`](/guide/semantic-selectors#sections) 类型 (见下表) |

- **`hide`** 从输出中移除列出的部分。未隐藏的所有内容默认按源文件顺序渲染。向简历中添加新部分意味着它会出现在所有地方，除非你明确隐藏它。
- **`pin`** 将列出的部分置于文档顶部，按指定顺序排列。未置顶的部分按它们在源文件中的原始顺序跟在后面。不论如何，Header 头部始终会渲染。

```yaml
sections:
  hide: [publications, volunteer]
  pin: [skills, work]
```

**有效的部分类型 (Valid section types):**

`basics`, `work`, `volunteer`, `education`, `awards`, `certificates`, `publications`, `skills`, `languages`, `interests`, `references`, `projects`

如果你使用了常见的同义词（例如用 `experience` 代替 `work`），错误消息会建议你使用规范名称。

同一个部分不能同时出现在 `hide` 和 `pin` 中。如果出现了，Resumx 会抛出错误。

**优先级:** CLI > view > frontmatter。在层叠中，每个子字段独立替换：在子视图中设置 `sections: { pin: [skills] }` 只会替换 `pin`，父视图的 `hide` 会被保留。

请参阅 [视图：章节 (Views: Sections)](/guide/views#sections) 获取完整指南。

### `bullet-order`

控制在使用标签或视图渲染时，每个部分内列表项（bullets）的排序方式。

| 属性         | 值                       |
| ------------ | ------------------------ |
| **类型**     | `none` \| `tag`          |
| **默认值**   | `none`                   |
| **CLI 标志** | `--bullet-order <value>` |

**可选值:**

| 值     | 行为                                                              |
| ------ | ----------------------------------------------------------------- |
| `none` | 文档顺序，按照 markdown 中的书写顺序。                            |
| `tag`  | 带有标签的列表项被提升到顶部，并按组内 `selects` 的声明顺序排序。 |

可作为基础默认值应用于所有视图，也可以在每个视图中覆盖。

```yaml
bullet-order: tag
```

请参阅 [视图：列表顺序 (Views: Bullet Order)](/guide/views#bullet-order) 获取完整指南。

### `tags`

标签组合与[标签视图](/guide/views#tag-views)配置。将组合标签定义为组成标签的并集，并可选择配置其隐式标签视图。在为某个组合标签渲染时，任何带有其构成标签的内容都会被包含。使用 `--for <name>` 来渲染标签视图。

| 属性       | 值                                      |
| ---------- | --------------------------------------- |
| **类型**   | `Record<string, string[] \| TagConfig>` |
| **默认值** | 无组合标签                              |

**简写** (仅组合):

```yaml
tags:
  fullstack: [frontend, backend]
  tech-lead: [backend, leadership]
  startup-cto: [fullstack, leadership, architecture]
```

**扩展** (组合 + 标签视图配置):

```yaml
tags:
  frontend:
    sections:
      hide: [publications]
      pin: [skills, projects]
    pages: 1

  fullstack:
    extends: [frontend, backend]
    sections:
      pin: [work, skills]
    pages: 2
```

简写 `fullstack: [frontend, backend]` 是 `fullstack: { extends: [frontend, backend] }` 的语法糖。

组合可以引用其他组合标签（递归展开）。循环引用会产生错误。每个组成成分都必须作为内容标签（在简历中的 `{.@name}`）或其他组合标签存在。拼写错误会产生带有 Levenshtein 建议的错误提示。

组成成分可以是[层级标签 (Hierarchical tags)](/guide/tags#hierarchical-tags)，如 `backend/node`。当展开时，每个组成成分的谱系（祖先 + 自身 + 后代）都会被包含：

```yaml
tags:
  stripe: [frontend, backend/node]
  # 展开为: @frontend (+ @frontend/* 后代)
  #        + @backend (祖先) + @backend/node (自身)
  #        + 无标签内容
```

请参阅 [标签 (Tags)](/guide/tags) 了解标签语法、组合、层级标签和标签视图。请参阅 [视图 (Views)](/guide/views) 了解自定义视图和临时视图。

### `vars`

可以在简历正文中使用 <code v-pre>{{ name }}</code> 语法引用的模板变量。变量提供了一种注入特定于某个申请的定制内容（如标语、关键词行）的方式，而无需编辑简历正文。

| 属性         | 值                       |
| ------------ | ------------------------ |
| **类型**     | `Record<string, string>` |
| **默认值**   | 无变量                   |
| **CLI 标志** | `-v, --var <key=value>`  |

此处定义的变量作为基础默认值。它们可以通过[视图](/guide/views) `vars` 或 CLI 的 `-v` 标志被覆盖。

**优先级:** CLI > view > frontmatter。

```yaml
vars:
  tagline: '拥有 8 年经验的全栈工程师'
  keywords: ''
```

在简历正文中：

```markdown
{{ tagline }}
```

当变量未定义或为空时，<code v-pre>{{ }}</code> 占位符将不产生任何内容（该行将从输出中移除）。变量值可以包含 markdown 格式，且会被正常渲染。

如果在 frontmatter 中定义了变量，但在文档中没有匹配的占位符，则会报错。

请参阅 [视图：变量 (Views: Variables)](/guide/views#variables) 获取完整指南。

### `icons`

自定义图标定义。键为可用于 `:slug:` 语法的图标简称；值为 SVG 字符串、URL 或 base64 数据 URI。

| 属性       | 值                       |
| ---------- | ------------------------ |
| **类型**   | `Record<string, string>` |
| **默认值** | 无自定义图标             |

Frontmatter 图标会覆盖同名的内置图标及 Iconify 图标。

```yaml
icons:
  mycompany: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
  partner: 'https://example.com/partner-logo.svg'
  badge: 'data:image/svg+xml;base64,PHN2Zz4uLi48L3N2Zz4='
```

请参阅 [图标 (Icons)](/guide/icons#custom-icons) 了解详情。

### `extra`

任意用户定义的数据。将此用于不属于内置 schema 的任何自定义字段（如姓名、目标职位、公司等）。值可以是字符串、数字、布尔值、数组或嵌套对象。

| 属性       | 值                        |
| ---------- | ------------------------- |
| **类型**   | `Record<string, unknown>` |
| **默认值** | 无自定义数据              |

未知的顶层字段会被拒绝并报错。`extra` 是存放自定义数据的唯一位置。

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

应用在默认样式之上的样式覆盖。键映射到生成 CSS 中的 `--key`（例如 `font-family` -> `--font-family`）。

| 属性         | 值                         |
| ------------ | -------------------------- |
| **类型**     | `Record<string, string>`   |
| **默认值**   | 无覆盖                     |
| **CLI 标志** | `-s, --style <name=value>` |

**优先级:** CLI > frontmatter

```yaml
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
  font-size: '10pt'
```

请参阅 [样式选项 (Style Options)](/guide/style-options#options-reference) 参考获取完整列表。

## 验证字段 (Validate Fields)

这些字段用于配置验证行为（默认在渲染前运行，或通过 `--check` 独立运行）。它们被放置在 `validate` 键下，与上面的渲染字段分开。

### `validate.extends`

要使用的基础验证预设。

| 属性       | 值                                         |
| ---------- | ------------------------------------------ |
| **类型**   | `string`                                   |
| **默认值** | `recommended`                              |
| **允许值** | `recommended`, `minimal`, `strict`, `none` |

**预设 (Presets):**

| 预设          | 包含的规则                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `recommended` | `missing-name`, `missing-contact`, `no-sections`, `no-entries`, `empty-bullet`, `long-bullet`, `single-bullet-section` |
| `minimal`     | `missing-name`, `missing-contact`, `no-sections`, `no-entries`, `empty-bullet`                                         |
| `strict`      | 与 `recommended` 规则相同（所有规则在其默认严重级别下运行）                                                            |
| `none`        | 无规则 — 验证实际上被禁用                                                                                              |

### `validate.rules`

逐个规则覆盖严重级别。将任何规则设置为严重级别或 `off` 以禁用它。

| 属性         | 值                                            |
| ------------ | --------------------------------------------- |
| **类型**     | `Record<string, Severity \| 'off'>`           |
| **严重级别** | `critical`, `warning`, `note`, `bonus`, `off` |

```yaml
validate:
  extends: recommended
  rules:
    long-bullet: warning # 从 critical 降级
    single-bullet-section: off # 完全禁用
```

### 可用规则

| 规则                     | 默认严重级别         | 描述                                             |
| ------------------------ | -------------------- | ------------------------------------------------ |
| `missing-name`           | `critical`           | 简历必须包含一个 H1 标题（你的名字）。           |
| `missing-contact`        | `critical`           | 简历必须在名字后包含联系信息（电子邮件或电话）。 |
| `no-sections`            | `critical`           | 简历必须至少包含一个 H2 部分（Section）。        |
| `no-entries`             | `warning`            | 简历应该至少包含一个 H3 条目（Entry）。          |
| `empty-bullet`           | `critical`           | 列表项必须有文本内容。                           |
| `long-bullet`            | `critical`/`warning` | 列表项超过了字符长度阈值。                       |
| `single-bullet-section`  | `bonus`              | 部分仅包含一个列表项。                           |
| `unknown-fenced-div-tag` | `warning`            | 命名栅栏区块使用了一个无法识别的 HTML 标签名。   |

### 完整示例

```yaml
---
pages: 1
output: ./out/Jane_Smith-{view}
bullet-order: tag
style:
  accent-color: '#0ea5e9'
tags:
  fullstack: [frontend, backend]
  leadership: false
vars:
  tagline: '拥有 8 年经验的全栈工程师'
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

自定义视图在外部的 `.view.yaml` 文件中定义。标签视图在 `tags:` 内部配置。请参阅 [视图 (Views)](/guide/views) 获取完整指南。

## 字段优先级

对于可以在多个位置设置的字段，解析顺序如下：

| 优先级   | 来源                            |
| -------- | ------------------------------- |
| 1 (最高) | 临时视图 (CLI 标志)             |
| 2        | 标签视图或自定义视图 (取其一)   |
| 3        | 默认视图 (frontmatter 渲染字段) |
| 4 (最低) | 内置默认值                      |

## 未知字段

任何不在已知集合（`css`, `output`, `pages`, `sections`, `bullet-order`, `style`, `icons`, `tags`, `vars`, `validate`, `extra`）中的顶层 frontmatter 键都会产生错误：

```
Unknown frontmatter field 'foo'. Use 'extra' for custom fields.
```

如果未知的字段看起来像是已知字段的拼写错误，会显示更具体的建议：

```
Unknown frontmatter field 'page'. Did you mean 'pages'?
```

要存储自定义数据，请使用 [`extra`](#extra) 字段。
