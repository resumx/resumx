# Tailwind CSS

::: info 第一次使用 Tailwind？
[Tailwind CSS](https://tailwindcss.com/) 是一個實用優先 (utility-first) 的 CSS 框架 — 您可以直接將像 `text-blue-800` 或 `px-2` 這樣的類別套用到元素上，而不需要編寫自訂 CSS。欲了解更多，請參閱 Tailwind 的 [使用實用類別設定樣式 (Styling with utility classes)](https://tailwindcss.com/docs/styling-with-utility-classes)。
:::

Resumx 會即時編譯 [Tailwind CSS v4](https://tailwindcss.com/)。您可以使用 [類別與 ID (Classes & IDs) 語法](/guide/classes-and-ids)將類別套用到任何元素上。

## 在 Markdown 中使用 Tailwind

### 行內區段 (Inline Spans)

```markdown
Built with [React]{.bg-blue-100 .text-blue-800 .px-2 .rounded}
[View Site](https://example.com){.text-blue-600 .after:content-['_↗']}
```

### 標題 (Headings)

```markdown
### Google {.text-gray-600 .font-normal}
```

### 區塊內容 (Block Content)

直接為列表或其他單一區塊元素設定樣式（不需要外層容器）：

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

將多個元素包裝在具有樣式的容器中：

<!-- prettier-ignore-start -->
```markdown
::: div {.bg-gray-50 .p-4 .rounded-lg}
## Section Title

Content with a styled container
:::
```
<!-- prettier-ignore-end -->

### 版面佈局 (Layout)

將圍欄 (fenced divs) 與 Tailwind 佈局實用類別結合使用。子元素可以使用括號區段 (bracketed spans) 或屬性列表：

<!-- prettier-ignore-start -->
```markdown
::: div {.flex .gap-4}
## Title {.flex-1}

[Button]{.self-end}
:::
```
<!-- prettier-ignore-end -->

## 任意值 (Arbitrary Values)

對於預設主題之外的單次使用的值，請使用方括號：

```markdown
[Custom color]{.text-[#ff6600]}
[After arrow]{.after:content-['↗']}
```

## 內建實用類別 (Built-in Utility Classes)

除了 Tailwind 之外，Resumx 也提供了幾個自己的實用類別：

| 類別                 | 效果                                 |
| -------------------- | ------------------------------------ |
| `.small-caps`        | 套用 `font-variant-caps: small-caps` |
| `.sr-only`           | 視覺上隱藏，但螢幕閱讀器可讀         |
| `.max-1` – `.max-16` | 隱藏第 N 個之後的子元素              |

### 限制可見的子元素數量 (Capping Visible Children)

`max-N` 類別會隱藏元素中第 N 個之後的所有子元素。當組合標籤視圖合併了許多帶有標籤的項目符號，產生了超出頁面能容納的內容時，這非常有用。

透過未命名的圍欄區塊套用，如此類別就會作用到 `<ul>`（單一子元素）上：

<!-- prettier-ignore-start -->
```markdown
::: {.max-3}
- Most important bullet
- Second most important
- Third most important
- ...remaining bullets hidden beyond 3rd
:::
```
<!-- prettier-ignore-end -->

在每個項目中將最重要的項目符號排在最前面，這樣限制數量後總能保留最有價值的內容。
