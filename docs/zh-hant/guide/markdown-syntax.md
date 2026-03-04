# Markdown 語法 (Markdown Syntax)

Resumx 使用標準的 [Markdown](https://www.markdownguide.org/basic-syntax/) 並加上一些擴充功能。本頁面涵蓋 Resumx 支援的語法，以及它如何在你的履歷中渲染。

## 標題 (Headings)

`h1` 是你的姓名。`h2` 代表開始一個區塊。`h3` 代表在區塊內開始一個項目。`h4`-`h6` 沒有特殊意義。

```markdown
# John Doe

## Experience

### Google
```

## 行內格式 (Inline Formatting)

| 語法                    | 結果                         |
| ----------------------- | ---------------------------- |
| `**Bold**`              | **粗體**                     |
| `_Italic_`              | _斜體_                       |
| `**_Bold and italic_**` | **_粗斜體_**                 |
| `` `Code` ``            | `Code` (渲染為技術標籤/徽章) |
| `==Highlight==`         | 螢光筆標示的文字             |
| `H~2~O`                 | H₂O (下標)                   |
| `E = mc^2^`             | E = mc² (上標)               |
| `--`                    | – (en-dash，連接號)          |
| `---`                   | — (em-dash，破折號)          |
| `"text"`                | "text" (智慧引號)            |
| `...`                   | … (刪節號)                   |

## 定義列表 (Definition Lists)

一個術語後接一行或多行 `: value`。術語會渲染為粗體標籤，而值會排列在同一行的行內。

```markdown
Languages
: JavaScript, TypeScript, Python, SQL

Frameworks
: React, Node.js, Express, FastAPI
```

在項目標題下方作為行內中繼資料也非常有用：

```markdown
### Google [June 2022 – Present]{.right}

Senior Software Engineer
: Infrastructure Platform Team
: San Francisco, CA
```

## 表格 (Tables)

在分隔列中使用 `:` 來對齊欄位：`:---` 靠左 (預設)，`:---:` 置中，`---:` 靠右。

```markdown
| Category   |           Technologies |
| :--------- | ---------------------: |
| Languages  | Python, TypeScript, Go |
| Frameworks | React, FastAPI, Django |
```

## 註解 (Comments)

HTML 註解會從輸出中被移除：

```markdown
- GPA: 3.8/4.0
<!-- - 這行不會出現 -->
- Dean's List (2018-2022)
```

## 行內分欄 (Inline Columns)

使用 `||` 將一行拆分成多欄，並將它們推向兩側。這是將日期或地點放置在標題或段落右側最簡單的方法。

<!-- prettier-ignore-start -->
:::: code-group
```markdown [Markdown]
### Google || Jan 2020 - Present
_Senior Software Engineer_ || San Francisco, CA
```

```html [HTML]
<h3>
	<span class="col">Google</span>
	<span class="col">Jan 2020 - Present</span>
</h3>
<p>
	<span class="col"><em>Senior Software Engineer</em></span>
	<span class="col">San Francisco, CA</span>
</p>
```
::::
<!-- prettier-ignore-end -->

你可以有超過兩欄：

```markdown
A || B || C
```

如果要寫出字面上的 `||`，請跳脫第一個直線符號：`\||`。
