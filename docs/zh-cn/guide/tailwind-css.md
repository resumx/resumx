# Tailwind CSS

::: info 没用过 Tailwind？
[Tailwind CSS](https://tailwindcss.com/) 是一个实用优先 (utility-first) 的 CSS 框架 — 直接将 `text-blue-800` 或 `px-2` 这样的类应用到元素上，而不是编写自定义 CSS。查看 Tailwind 的 [使用实用类进行样式设置](https://tailwindcss.com/docs/styling-with-utility-classes) 了解更多。
:::

Resumx 即时编译 [Tailwind CSS v4](https://tailwindcss.com/)。使用 [类与 ID 语法](/guide/classes-and-ids) 将类应用到任何元素。

## 在 Markdown 中使用 Tailwind

### 内联 Span

```markdown
Built with [React]{.bg-blue-100 .text-blue-800 .px-2 .rounded}
[View Site](https://example.com){.text-blue-600 .after:content-['_↗']}
```

### 标题

```markdown
### Google {.text-gray-600 .font-normal}
```

### 块级内容

直接为一个列表或其他单个块级元素设置样式（不需要包装器）：

<!-- prettier-ignore-start -->
```markdown
::: {.grid .grid-cols-3 .gap-x-4 .list-none}
- JavaScript
- TypeScript
- Python
- React
- Node.js
- PostgreSQL
:::
```
<!-- prettier-ignore-end -->

将多个元素包装在一个带有样式的容器中：

<!-- prettier-ignore-start -->
```markdown
::: div {.bg-gray-50 .p-4 .rounded-lg}
## Section Title

Content with a styled container
:::
```
<!-- prettier-ignore-end -->

### 布局

将围栏式 div 与 Tailwind 布局实用程序结合使用。子元素可以使用括号 span 或属性列表：

<!-- prettier-ignore-start -->
```markdown
::: div {.flex .gap-4}
## Title {.flex-1}

[Button]{.self-end}
:::
```
<!-- prettier-ignore-end -->

## 任意值

对于默认主题之外的一次性值，请使用方括号：

```markdown
[Custom color]{.text-[#ff6600]}
[After arrow]{.after:content-['↗']}
```

## 内置实用类

除了 Tailwind 之外，Resumx 还提供了一些自己的实用类：

| 类                   | 效果                                 |
| -------------------- | ------------------------------------ |
| `.small-caps`        | 应用 `font-variant-caps: small-caps` |
| `.sr-only`           | 视觉上隐藏，屏幕阅读器可访问         |
| `.max-1` – `.max-16` | 隐藏第 N 个之后的子元素              |

### 限制可见子元素数量

`max-N` 类隐藏元素中第 N 个之后的所有子元素。当复合标签视图组合了许多带标签的子弹点，产生的内容超出页面合适容量时，这非常有用。

通过未命名的围栏式 div 应用，以便该类作用于 `<ul>`（单个子元素）：

<!-- prettier-ignore-start -->
```markdown
::: {.max-3}
- 最重要的点
- 第二重要的点
- 第三重要的点
- ...超过第三个的剩余点将被隐藏
:::
```
<!-- prettier-ignore-end -->

在每个条目中将点按从最重要到最不重要的顺序排列，这样限制总是保留最强的内容可见。
