# Markdown 语法

Resumx 使用标准的 [Markdown](https://www.markdownguide.org/basic-syntax/) 并提供了一些扩展功能。本页面介绍了 Resumx 支持的语法及其在你的简历中的渲染方式。

## 标题 (Headings)

`h1` 是你的名字。`h2` 开始一个新的章节。`h3` 开始一个章节内的条目。`h4`-`h6` 没有特殊含义。

```markdown
# John Doe

## Experience

### Google
```

## 内联格式 (Inline Formatting)

| 语法                    | 结果                         |
| ----------------------- | ---------------------------- |
| `**Bold**`              | **粗体**                     |
| `_Italic_`              | _斜体_                       |
| `**_Bold and italic_**` | **_粗斜体_**                 |
| `` `Code` ``            | `代码` (渲染为技术标签/徽章) |
| `==Highlight==`         | 高亮文本                     |
| `H~2~O`                 | H₂O (下标)                   |
| `E = mc^2^`             | E = mc² (上标)               |
| `--`                    | – (en-dash 短划线)           |
| `---`                   | — (em-dash 长划线)           |
| `"text"`                | "text" (智能引号)            |
| `...`                   | … (省略号)                   |

## 定义列表 (Definition Lists)

一个术语后面跟着一行或多行 `: value`。该术语被渲染为粗体标签，而值将在同一行内联排布。

```markdown
Languages
: JavaScript, TypeScript, Python, SQL

Frameworks
: React, Node.js, Express, FastAPI
```

在条目标题下方作为内联元数据也非常有用：

```markdown
### Google [June 2022 – Present]{.right}

Senior Software Engineer
: Infrastructure Platform Team
: San Francisco, CA
```

## 表格 (Tables)

在分隔行中使用 `:` 来对齐列：`:---` 居左 (默认)，`:---:` 居中，`---:` 居右。

```markdown
| Category   |           Technologies |
| :--------- | ---------------------: |
| Languages  | Python, TypeScript, Go |
| Frameworks | React, FastAPI, Django |
```

## 注释 (Comments)

HTML 注释会从输出中被剥离：

```markdown
- GPA: 3.8/4.0
<!-- - 此行不会出现 -->
- Dean's List (2018-2022)
```

## 内联列 (Inline Columns)

使用 `||` 将一行分割成多列，把它们推向两端。这是将日期或地点放置在标题或段落右侧的最简单的方法。

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

你可以拥有超过两列：

```markdown
A || B || C
```

若要写入原义的 `||`，请对第一个管道符进行转义：`\||`。
