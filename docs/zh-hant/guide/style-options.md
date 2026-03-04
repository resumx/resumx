# 樣式選項 (Style Options)

Resumx 提供了一組樣式選項，你可以覆寫這些選項來客製化你的履歷，而無需修改 Markdown。

## 覆寫樣式

在 frontmatter 中設定 `style:` 來覆寫任何選項：

```markdown
---
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
  section-title-border: none
---
```

你也可以透過 CLI 的 `--style` 進行覆寫。詳情請參閱 [CLI 參考指南](/guide/cli-reference)。

**優先級：** CLI `--style` > Frontmatter > 預設值

## 選項參考

### 排版 (Typography)

| 變數                  | 預設值               | 描述                                    |
| --------------------- | -------------------- | --------------------------------------- |
| `font-family`         | `'Georgia', serif`   | 基礎字體系列 (未設定時由標題與內容使用) |
| `title-font-family`   | `var(--font-family)` | 姓名 (h1) 及區塊標題 (h2) 的字體        |
| `content-font-family` | `var(--font-family)` | 內文、項目標題 (h3)、列表等使用的字體   |
| `font-size`           | `11pt`               | 基礎字體大小 (建議使用 10–12pt)         |
| `line-height`         | `1.35`               | 行高比例                                |

### 顏色 (Colors)

| 變數               | 預設值    | 描述         |
| ------------------ | --------- | ------------ |
| `text-color`       | `#333`    | 主要文字顏色 |
| `muted-color`      | `#555`    | 次要文字顏色 |
| `accent-color`     | `inherit` | 強調色       |
| `link-color`       | `#0563bb` | 連結顏色     |
| `background-color` | `#fff`    | 頁面背景色   |

### 標題 (Headings)

| 變數                   | 預設值                                 | 描述                                                  |
| ---------------------- | -------------------------------------- | ----------------------------------------------------- |
| `name-size`            | `1.85rem`                              | 姓名 (h1) 的字體大小                                  |
| `name-caps`            | `normal`                               | 姓名大小寫 (`small-caps`, `all-small-caps`, `normal`) |
| `name-weight`          | `normal`                               | 姓名文字粗細                                          |
| `name-italic`          | `normal`                               | 姓名斜體 (`normal`, `italic`)                         |
| `section-title-size`   | `1.22rem`                              | 區塊標題 (h2) 字體大小                                |
| `section-title-caps`   | `normal`                               | 區塊標題大小寫                                        |
| `section-title-weight` | `bold`                                 | 區塊標題文字粗細                                      |
| `section-title-color`  | `var(--text-color)`                    | 區塊標題顏色                                          |
| `section-title-border` | `1px solid var(--section-title-color)` | 區塊標題底線邊框                                      |
| `header-align`         | `center`                               | 頁首對齊 (`left`, `center`, `right`)                  |
| `section-title-align`  | `left`                                 | 區塊標題對齊                                          |
| `entry-title-size`     | `1.05rem`                              | 項目標題 (h3) 字體大小                                |
| `entry-title-weight`   | `bold`                                 | 項目標題文字粗細                                      |

### 連結 (Links)

| 變數             | 預設值 | 描述                               |
| ---------------- | ------ | ---------------------------------- |
| `link-underline` | `none` | 連結底線樣式 (`underline`, `none`) |

### 間距 (Spacing)

| 變數            | 預設值  | 描述                                                       |
| --------------- | ------- | ---------------------------------------------------------- |
| `page-margin-x` | `0.5in` | 頁面水平邊距                                               |
| `page-margin-y` | `0.5in` | 頁面垂直邊距                                               |
| `gap`           | `1`     | 所有垂直間距的無單位縮放係數                               |
| `section-gap`   | `10px`  | 區塊之間的間距 (受 `gap` 縮放)                             |
| `entry-gap`     | `5px`   | 項目之間的間距 (受 `gap` 縮放)                             |
| `row-gap`       | `2px`   | 列表項目、定義列表列及表格行之間的垂直間距 (受 `gap` 縮放) |
| `col-gap`       | `12px`  | 定義列表與表格的欄間距                                     |
| `list-indent`   | `1.2em` | 列表縮排                                                   |

### 列表 (Lists)

| 變數           | 預設值 | 描述                                                  |
| -------------- | ------ | ----------------------------------------------------- |
| `bullet-style` | `disc` | 列表項目符號樣式 (`disc`, `circle`, `square`, `none`) |

### 功能 (Features)

| 變數    | 預設值   | 描述                        |
| ------- | -------- | --------------------------- |
| `icons` | `inline` | 圖示顯示 (`inline`, `none`) |

## 樣式範例 (Style Recipes)

這裡有一些 `style:` 的程式碼片段，僅使用變數覆寫就能創造出獨特的視覺效果。

### 經典襯線體 (預設)

```yaml
style:
  font-family: "'Georgia', serif"
  header-align: center
  name-caps: normal
```

無需任何覆寫，這就是預設呈現的效果。

### 蘇黎世 (Zurich)

溫暖的襯線體搭配小型大寫字母姓名，以及強調色的區塊標題。

```yaml
style:
  font-family: "'Palatino Linotype', Palatino, Georgia, serif"
  accent-color: '#c43218'
  name-caps: small-caps
  section-title-color: var(--accent-color)
  section-title-border: 1.5px solid var(--section-title-color)
```

### 西雅圖 (Seattle)

俐落的無襯線體搭配靠左對齊的頁首與柔和的區塊邊框。

```yaml
style:
  font-family: "'Arial', 'Helvetica Neue', sans-serif"
  text-color: '#2d3748'
  section-title-border: 2px solid #b0b5be
  header-align: left
  bullet-style: circle
```

### 極簡 (Minimal)

無區塊邊框、緊湊的間距、全大寫的區塊標題。

```yaml
style:
  section-title-border: none
  section-title-caps: uppercase
  section-gap: 6px
  entry-gap: 3px
```

### 現代粗體 (Bold Modern)

強烈對比搭配鮮明的強調色。

```yaml
style:
  font-family: "'Inter', 'Segoe UI', sans-serif"
  accent-color: '#2563eb'
  name-weight: bold
  section-title-color: var(--accent-color)
  link-color: var(--accent-color)
```
