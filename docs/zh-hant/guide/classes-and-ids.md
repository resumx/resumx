# 類別與 ID (Classes & IDs)

使用大括號 `{...}` 語法，為任何 Markdown 元素加入類別 (classes)、ID 及 HTML 屬性。

## 括號區塊 (Bracketed Spans)

將行內文字包裝在 `[text]{...}` 中，以產生帶有指定類別、ID 或屬性的 `<span>`：

| Markdown               | HTML                                    |
| ---------------------- | --------------------------------------- |
| `[text]{.right}`       | `<span class="right">text</span>`       |
| `[text]{#my-id}`       | `<span id="my-id">text</span>`          |
| `[text]{data-x="val"}` | `<span data-x="val">text</span>`        |
| `[text]{.a .b #id}`    | `<span class="a b" id="id">text</span>` |

這是 Resumx 中最常見的語法 — 用於套用 [Tailwind CSS](/guide/tailwind-css) 類別、為[客製化變體](/guide/tags)標記內容等等：

```markdown
### Google [2022 – Present]{.right}

_Senior Software Engineer_ [San Francisco, CA]{.right}
```

## 元素屬性 (Element Attributes)

當 `{...}` 出現在區塊元素的結尾，且前面沒有 `[...]` 時，它會套用於整個元素，而不是將文字包裝在 span 內：

```markdown
## Experience

### Google {.small-caps}

- Designed REST APIs with OpenAPI documentation {.@backend}
- Built interactive dashboards with React and D3.js {.@frontend}
- Led team of 5 engineers to deliver project 2 weeks early
```

## 圍欄區塊 (Fenced Divs)

使用 `:::` 將屬性套用於區塊內容。當只有單一子元素時，屬性會直接套用於該元素：

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

這不會產生包裝用的 `<div>`。這是在不增加額外層級的情況下，為列表、區塊引言 (blockquotes) 和表格等區塊元素設定樣式的主要方式。

如果圍欄區塊包含多個子元素，它會自動提升為帶有這些屬性的 `<div>` 容器：

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

你也可以在前面加上標籤名稱 (例如 `::: footer {.text-center}`)，來產生特定的 HTML 元素，而非 `<div>`。
