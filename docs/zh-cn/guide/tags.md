# 标签 (Tags)

标签（Tags）就是内容过滤器。它们控制你的简历的哪些部分展示给特定的受众，而不会改变任何渲染方式。[视图 (Views)](/guide/views) 则负责渲染。请参考 [定制化原理](/guide/tailoring) 以了解其概念模型。

## 标记内容

将 `{.@name}` 添加到任何元素中，以将其标记给特定受众。未加标签的内容始终会通过过滤器显示。带标签的内容仅在针对匹配该标签进行渲染时才会显示。

```markdown
- Built distributed systems serving 1M requests/day
- Built interactive dashboards with React and D3.js {.@frontend}
- Designed REST APIs with OpenAPI documentation {.@backend}
- Led team of 5 engineers to deliver project 2 weeks early
```

::: code-group

```markdown [frontend]
- Built distributed systems serving 1M requests/day
- Built interactive dashboards with React and D3.js
- Led team of 5 engineers to deliver project 2 weeks early
```

```markdown [backend]
- Built distributed systems serving 1M requests/day
- Designed REST APIs with OpenAPI documentation
- Led team of 5 engineers to deliver project 2 weeks early
```

:::

使用多个类名将元素包含在多个标签中：

```markdown
- Implemented GraphQL API layer with TypeScript {.@backend .@frontend}
```

你也可以使用[括号包裹](/guide/classes-and-ids#bracketed-spans)为行内文本打标签，或使用[栅栏区块](/guide/classes-and-ids#fenced-divs)包裹整个部分打标签。

<!-- Every tag is renderable with `--for`: -->

<!--
Every tag implicitly carries a [tag view](#tag-views), so `--for frontend` always works even without a `.view.yaml` file. Output files include the view name: `resume-frontend.pdf`, `resume-backend.pdf`. For per-application render configuration (layout, variables, style), create a [custom view](/guide/views#custom-views).

```bash
resumx resume.md --for frontend
resumx resume.md --for backend
``` -->

## 组合 (Composition)

假设你想要一个 `fullstack` 过滤器，它同时包含 `{.@frontend}` 和 `{.@backend}` 的内容。你可以给每一项都添加 `{.@fullstack}`，但那样太繁琐了。相反，你可以在 frontmatter 中组合标签。组合标签扩展了其过滤器的范围，以覆盖其组成部分：

```yaml
---
tags:
  fullstack: [frontend, backend]
---
```

现在 `fullstack` 包含了所有 `{.@frontend}` 的内容、所有 `{.@backend}` 的内容，以及任何显式标记了 `{.@fullstack}` 的内容，外加未加标签的通用内容。

组合标签可以引用其他的组合标签：

```yaml
---
tags:
  fullstack: [frontend, backend]
  tech-lead: [backend, leadership]
  startup-cto: [fullstack, leadership, architecture]
---
```

`startup-cto` 会被<span class="hint" data-hint="包含子标签的子标签，不仅仅是直接的子标签">传递性（transitively）</span>展开：`fullstack` 解析为 `frontend` + `backend`，因此最终集合为 `{startup-cto, fullstack, frontend, backend, leadership, architecture}`。

该组中的每个标签都必须作为内容标签（在你的简历中为 `{.@name}`）或其他组合标签存在——如果不存在，Resumx 会引发错误并提供可能拼写错误的建议。顺序将被保留，并在配置时控制列表项排序。循环引用（例如，`a: [b]` 和 `b: [a]`）会被检测到并引发错误。

::: info 仅支持并集，不支持交集
标签和组合仅使用并集（Union）逻辑。如果你需要交集（Intersection），请创建一个更具体的标签，如 `{.@senior-frontend}`，而不是试图将 `@senior` 和 `@frontend` 取交集。
:::

标签也可以携带特定于标签的渲染配置（布局、页面、样式）。请参阅 [标签视图 (Tag Views)](/guide/views#tag-views)。

## 层级标签 (Hierarchical Tags)

当一个领域跨越多个生态系统时，扁平化的标签会迫使你做出选择：打广泛的标签（`@backend`）从而失去区分技术栈的能力，或打狭窄的标签（`@node`，`@jvm`）从而失去共享的父级上下文。层级标签通过直接编码这种关系来解决这个问题。

### 语法

使用 `/` 将子标签嵌套在其父标签下：

```markdown
- Designed REST APIs with OpenAPI documentation {.@backend}
- Built microservices with `Express` and `Bull` queues {.@backend/node}
- Migrated `Spring Boot` monolith to modular architecture {.@backend/jvm}
```

深度不限：`{.@data/ml/nlp}` 是有效的，并嵌套了三层深。

### 继承

一条原则：**包含你的整个谱系（祖先 + 自身 + 后代）和未加标签的内容。兄弟节点及其子树被排除在外。**

| 渲染命令             | 包含                                                             | 排除                                 |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------ |
| `--for backend/node` | `@backend` + `@backend/node` + 未打标签                          | `@backend/jvm`, `@frontend`, 等等    |
| `--for backend`      | `@backend` + `@backend/node` + `@backend/jvm` + 未打标签         | `@frontend`, `@leadership`, 等等     |
| `--for data/ml`      | `@data` + `@data/ml` + `@data/ml/nlp` + `@data/ml/cv` + 未打标签 | `@data/analytics`, `@frontend`, 等等 |

子视图（`--for backend/node`）继承其祖先的通用内容（`@backend`），因此标记为 `@backend` 的 "Designed REST APIs" 列表项同时出现在 `backend/node` 和 `backend/jvm` 视图中。父视图（`--for backend`）包含了它的所有后代，从而提供了该领域的完整视图。

点击下方任意节点查看哪些标签被包含：

<TagLineage />

### 与层级标签组合

层级标签可与[组合](#composition)一起使用。谱系按每个组成部分扩展：

```yaml
---
tags:
  stripe: [frontend, backend/node]
---
```

`stripe` 扩展为：`@frontend`（+ 任何 `@frontend/*` 后代）+ `@backend`（`backend/node` 的祖先）+ `@backend/node` + 未加标签的内容。兄弟标签 `@backend/jvm` 被排除，因为只列出了 `backend/node`，而不是 `backend`。

### 何时使用层级标签

当一个领域确实分为不可互换的生态系统，并且你需要广泛的视图和狭窄的视图时，请使用层级。一些指南：

- **好的做法:** `backend/node`, `backend/jvm` (不同的技术栈，共享的父级上下文)
- **好的做法:** `data/ml/nlp`, `data/ml/cv` (机器学习中的子专业)
- **没必要:** `frontend/css` (CSS 很少作为一个独立的招聘过滤器)
- **错误的:** `backend/api` (API 是所有后端工作的一部分，而不是一个独立的生态系统)

如果你不会为它创建单独的简历变体，那么它可能就不需要拥有自己的一级标签。
