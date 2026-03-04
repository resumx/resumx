# 类与 ID (Classes & IDs)

使用花括号 `{...}` 语法为任何 Markdown 元素添加类名（Classes）、ID 和 HTML 属性。

## 括号包裹的行内元素 (Bracketed Spans)

使用 `[text]{...}` 包裹行内文本，可以生成带有指定类名、ID 或属性的 `<span>`：

| Markdown               | HTML                                    |
| ---------------------- | --------------------------------------- |
| `[text]{.right}`       | `<span class="right">text</span>`       |
| `[text]{#my-id}`       | `<span id="my-id">text</span>`          |
| `[text]{data-x="val"}` | `<span data-x="val">text</span>`        |
| `[text]{.a .b #id}`    | `<span class="a b" id="id">text</span>` |

这是 Resumx 中最常用的语法 —— 用于应用 [Tailwind CSS](/guide/tailwind-css) 类名、为[定制化变体](/guide/tags)添加标签等：

```markdown
### Google [2022 – Present]{.right}

_Senior Software Engineer_ [San Francisco, CA]{.right}
```

## 元素属性 (Element Attributes)

当 `{...}` 出现在块级元素的末尾，且前面没有搭配 `[...]` 时，该属性将应用于整个块级元素，而不是包裹文本生成 span：

```markdown
## Experience

### Google {.small-caps}

- Designed REST APIs with OpenAPI documentation {.@backend}
- Built interactive dashboards with React and D3.js {.@frontend}
- Led team of 5 engineers to deliver project 2 weeks early
```

## 栅栏区块 (Fenced Divs)

使用 `:::` 将属性应用到块级内容上。如果区块内只有一个子元素，属性会直接应用于该子元素：

<!-- prettier-ignore-start -->
:::: code-group
```markdown [Markdown]
## Technical Skills

::: {.grid .grid-cols-3}
- JavaScript
- TypeScript
- Python
- React
- Node.js
- PostgreSQL
:::
```

```html [HTML]
<h2>Technical Skills</h2>

<ul class="grid grid-cols-3">
	<li>JavaScript</li>
	<li>TypeScript</li>
	<li>Python</li>
	<li>React</li>
	<li>Node.js</li>
	<li>PostgreSQL</li>
</ul>
```
::::
<!-- prettier-ignore-end -->

![Fenced div with unnamed form](/images/grid-bullet-with-fence.png)

这里不会额外输出一个 `<div>` 包装器。这是为列表、引用块、表格等块级元素设置样式而无需增加额外嵌套的主要方法。

如果栅栏区块内包含多个子元素，它会自动提升为一个带有这些属性的 `<div>` 包装器：

<!-- prettier-ignore-start -->
:::: code-group
```markdown [Markdown]
::: {.flex .gap-4}
## Title

Some paragraph
:::
```

```html [HTML]
<div class="flex gap-4">
	<h2>Title</h2>

	<p>Some paragraph</p>
</div>
```

::::
<!-- prettier-ignore-end -->

你还可以指定标签名作为前缀（例如：`::: footer {.text-center}`），来输出特定的 HTML 元素，而不是 `<div>`。
