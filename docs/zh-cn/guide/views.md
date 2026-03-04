# 视图 (Views)

[标签 (Tags)](/guide/tags) 用于过滤你的内容。视图 (Views) 则配置过滤后的内容如何渲染：哪些块出现、以什么顺序排列、注入哪些关键词、目标页数是多少。关于其心理模型，请参见[按需定制是如何工作的](/guide/tailoring)。

## 四种视图

每次渲染都会使用一个视图。它们的区别在于定义的位置以及创建所需的工作量。

| 种类                                          | 位置                           | 性质                                   |
| --------------------------------------------- | ------------------------------ | -------------------------------------- |
| [默认视图 (Default view)](#default-view)      | frontmatter 渲染字段           | 所有渲染的基础配置                     |
| [标签视图 (Tag view)](#tag-views)             | frontmatter `tags:` 的扩展形式 | 每个标签的覆盖配置，对每个标签隐式生效 |
| [自定义视图 (Custom view)](#custom-views)     | `.view.yaml` 文件              | 每次申请的特定配置                     |
| [临时视图 (Ephemeral view)](#ephemeral-views) | CLI 标志                       | 一次性配置，不持久化                   |

标签视图和自定义视图是平级的，而不是层级关系。`--for` 只会解析为其中之一，永远不会同时解析。详情请参阅[层叠顺序 (Cascade Order)](#cascade-order)。

## 默认视图

frontmatter 中的渲染字段（`pages`、`style`、`vars`、`sections`、`bullet-order`）构成了默认视图。它们会应用于每次渲染，除非被更具体的视图覆盖。

```yaml
---
pages: 1
sections:
  hide: [publications]
style:
  accent-color: '#2563eb'
vars:
  tagline: 'Full-stack engineer with 8 years of experience'
---
```

即使没有 frontmatter，简历也仍然有一个默认视图，只是所有的配置都使用了内置的默认值。

## 标签视图

每个[标签](/guide/tags)都会隐式生成一个标签视图。在没有额外配置的情况下，标签视图会继承[默认视图](#default-view)的所有默认值。你可以使用 frontmatter 中的扩展形式来配置标签视图：

```yaml
---
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
---
```

简写形式 `fullstack: [frontend, backend]` 是 `fullstack: { extends: [frontend, backend] }` 的语法糖。当你需要在标签视图上配置渲染时，请使用扩展形式。

配置标签视图不会改变标签本身。其他标签仍然可以组合它，正文中的 `{.@frontend}` 依然有效。标签处理的是内容（显示什么），而其标签视图处理的是渲染（如何显示）。

## 自定义视图

自定义视图存放在 `.view.yaml` 文件中。顶层键是视图名称：

```yaml
# stripe.view.yaml
stripe-swe:
  selects: [backend/node, distributed-systems, leadership]
  sections:
    hide: [publications]
    pin: [skills, work]
  vars:
    tagline: 'Stream Processing, Event-Driven Architecture, Node.js, Kafka'

stripe-pm:
  selects: [frontend, leadership]
  vars:
    tagline: 'Product Strategy, Cross-functional Leadership'
```

Resumx 会相对于简历文件递归查找所有 `**/*.view.yaml` 文件。你可以随心所欲地组织它们：

```
resume.md
stripe-swe.view.yaml
views/
  active/
    netflix.view.yaml
  archive/
    old-google.view.yaml
```

使用 `--for` 进行渲染：

```bash
resumx resume.md --for stripe-swe
```

::: info 视图解析
`--for` 会同时在自定义视图和标签视图中解析名称。如果一个名称同时匹配两者，Resumx 将抛出错误。Glob 模式 (`--for 'stripe-\*'`) 会匹配所有命名的视图（包括标签和自定义视图）。有关 `--for` 模式的完整列表，请参见 [CLI 参考](/guide/cli-reference)。
:::

## 自定义视图字段

| 字段           | 类型                     | 描述                                               |
| -------------- | ------------------------ | -------------------------------------------------- |
| `selects`      | `string[]`               | 要包含的内容标签（并集）。                         |
| `sections`     | `object`                 | 块的可见性和顺序（见[块 (Sections)](#sections)）。 |
| `pages`        | `number`                 | 目标页数（覆盖 frontmatter）。                     |
| `bullet-order` | `none` \| `tag`          | 列表项排序策略。默认：`none`。                     |
| `vars`         | `Record<string, string>` | 用于 <code v-pre>{{ }}</code> 占位符的变量值。     |
| `style`        | `Record<string, string>` | 样式覆盖（同 frontmatter 中的 `style`）。          |
| `format`       | `string`                 | 输出格式（`pdf`、`html`、`docx`、`png`）。         |
| `output`       | `string`                 | 输出路径（同 frontmatter 中的 `output`）。         |

基础默认值（pages、style、bullet-order）位于 frontmatter 中。自定义视图字段是覆盖项。

### 内容过滤

没有 `selects` 的自定义视图不会应用任何内容过滤器。所有内容都会被渲染，无论是否有标签。当视图仅需要渲染配置时，这非常有用：

```yaml
one-pager:
  sections:
    pin: [skills, work]
  pages: 1
```

显式的空数组（`selects: []`）则完全不同：它的意思是“不选择任何标签”，因此只会显示未打标签的内容。带标签的内容将被过滤掉。可以把它想象成 SQL 查询：省略 WHERE 子句会返回所有内容，而 `WHERE tag IN ()` 不会匹配任何内容。`selects` 中的每个标签名都必须是存在的内容标签、组合标签或标签视图；未知的名称会产生错误，并提供可能的拼写纠正建议。

```yaml
generic:
  selects: [] # 仅未打标签（通用）的内容
  pages: 1
```

| 定义                           | 行为                                    |
| ------------------------------ | --------------------------------------- |
| 无 `selects`                   | 所有内容（无过滤器）                    |
| `selects: [frontend, backend]` | 未打标签内容 + `@frontend` + `@backend` |
| `selects: []`                  | 仅未打标签内容                          |

## 变量

标签用于过滤内容。变量则用于向 <code v-pre>{{ }}</code> 占位符中注入针对每次申请的新文本：

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

当定义了变量时，其值将在原地渲染。未定义时，占位符不会产生任何内容（没有空白）。变量值可以包含 Markdown 格式（例如 `**粗体**`），它们会被正常渲染，因为替换发生在 Markdown 解析之前。

定义了变量却没有匹配的 <code v-pre>{{ }}</code> 占位符将导致错误。

变量的解析顺序为：临时视图 (CLI `-v`) > 标签视图或自定义视图的 `vars` > 默认视图的 `vars`。

## 块 (Sections)

`sections` 是一个用于控制哪些块显示以及如何排序的命名空间。它包含两个子字段：

- **`hide`** 从输出中移除块。默认情况下，所有未隐藏的内容将按源文件顺序渲染。
- **`pin`** 将块按指定顺序置顶在文档中。未置顶的块将按其原始的源文件顺序跟随其后。

这两个字段都接受 [`data-section`](/guide/semantic-selectors#sections) 类型的值（例如 `work`、`skills`、`education`）。如果你使用了常见的同义词（如 `experience`），Resumx 会建议使用规范名称。

```yaml
sections:
  hide: [publications, volunteer]
  pin: [skills, work]
```

这会隐藏 publications（出版物）和 volunteer（志愿者）部分，将 skills（技能）置顶为第一位，work（工作经历）第二位，其余内容则按源文件顺序跟随其后。无论如何配置，头部（header）始终会被渲染。

同一个部分不能同时出现在 `hide` 和 `pin` 中。如果出现这种情况，Resumx 将抛出错误。

在 CLI 上，可以使用 `--hide` 和 `--pin` 标志（它们在内部映射到 `sections.hide` 和 `sections.pin`）：

```bash
resumx resume.md --hide publications --pin skills,work
```

## 列表项排序 (Bullet Order)

`bullet-order` 控制每个块内列表项的排列方式。

| 值     | 行为                                                                  |
| ------ | --------------------------------------------------------------------- |
| `none` | 文档顺序，按照 Markdown 中的书写顺序。**(默认)**                      |
| `tag`  | 带有标签的列表项提升至顶部，并在该组内按照 `selects` 声明的顺序排序。 |

假设：

```markdown
- Led team of 5 engineers to deliver project 2 weeks early
- Designed event-driven microservices handling 2M events/day {.@distributed-systems}
- Built REST APIs with OpenAPI documentation {.@backend}
```

在使用 `bullet-order: tag` 和 `selects: [backend, distributed-systems]` 时，带有标签的列表项会浮动到顶部，并按照 `selects` 的声明顺序排序（`backend` 在 `distributed-systems` 之前）：

```markdown
- Built REST APIs with OpenAPI documentation {.@backend}
- Designed event-driven microservices handling 2M events/day {.@distributed-systems}
- Led team of 5 engineers to deliver project 2 weeks early
```

这样招聘人员在 7.4 秒的快速浏览中能首先看到最相关的内容，而你无需在源文件中重新排列任何东西。

## 临时视图

CLI 标志如 `-v`、`--hide`、`--pin`、`--pages`、`--bullet-order` 和 `-s` 会在内联创建一个临时视图，而不会持久化。这对于快速迭代、编写脚本和 CI 管道非常有用：

```bash
resumx resume.md --for backend -v tagline="Stream Processing, Go" --pin skills,work -o stripe.pdf
```

这在功能上相当于一个包含 `selects: [backend]`、`vars.tagline`、`sections.pin` 和 `output` 的视图，只是它不存在于文件中。

## 层叠顺序

视图呈层叠状堆叠，就像 CSS 的层叠规则一样。每一层都可以覆盖下一层的特定字段。在某一层中未设置的字段会向下传递。

```
内置默认值
  → 默认视图 (frontmatter 渲染字段)
    → 标签视图 或 自定义视图 (--for 解析为哪一个)
      → 临时视图 (CLI 标志)
```

标签视图和自定义视图处于同一层级。`--for` 会明确解析为其中之一，并且该视图会覆盖默认视图。如果名称同时匹配标签和自定义视图，Resumx 会抛出错误。临时视图（CLI 标志）覆盖一切。

### 字段如何合并

并非所有字段都以相同方式合并。规则取决于字段的形状：

| 字段形状 | 字段                                        | 合并规则                             |
| -------- | ------------------------------------------- | ------------------------------------ |
| 标量     | `pages`、`bullet-order`、`format`、`output` | 较后层替换                           |
| 记录     | `vars`、`style`                             | 浅合并（较后的键覆盖，保留较前的键） |
| 命名空间 | `sections`                                  | 每个子字段（`hide`、`pin`）独立替换  |
| 数组     | `selects`、`css`                            | 较后层替换（不进行拼接）             |

例如，如果默认视图设置了 `vars: { tagline: "Full-stack engineer", keywords: "React" }`，而自定义视图设置了 `vars: { tagline: "Backend engineer" }`，解析结果为 `{ tagline: "Backend engineer", keywords: "React" }`。自定义视图的 `tagline` 会覆盖，而默认视图的 `keywords` 被保留。

对于 `sections`，每个子字段会独立替换。如果在子视图中设置 `sections: { pin: [skills] }`，只会替换 `pin`，父视图的 `hide` 将被保留。在子视图中设置 `sections: { hide: [] }` 意味着“取消隐藏所有内容”，而不会影响 `pin`。

## 批量渲染

一次性渲染所有视图，或使用 glob 模式渲染子集：

```bash
resumx resume.md --for '*'
resumx resume.md --for 'stripe-*'
```

要将默认视图（无标签过滤）与特定视图一起包含，请使用 `--for default` 并列出命名的视图。名称 `default` 是保留字；请勿将其用作标签或自定义视图。示例：`resumx resume.md --for default,frontend` 将生成 `resume.pdf`（所有内容）和 `resume-frontend.pdf`（经过 frontend 过滤）。

Glob 模式会匹配所有命名的视图（包括标签视图和自定义视图）。该模式必须至少匹配一个视图，否则 Resumx 将抛出错误并列出可用的名称。
