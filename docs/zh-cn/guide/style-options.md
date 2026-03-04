# 样式选项 (Style Options)

Resumx 提供了一组样式选项，你可以覆盖这些选项以自定义简历，而无需修改 Markdown 内容。

## 覆盖样式

在 frontmatter 中设置 `style:` 即可覆盖任何选项：

```markdown
---
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
  section-title-border: none
---
```

你也可以通过 CLI 使用 `--style` 进行覆盖。详见 [CLI 参考](/guide/cli-reference)。

**优先级:** CLI `--style` > Frontmatter > 默认值

## 选项参考

### 排版 (Typography)

| 变量                  | 默认值               | 描述                                           |
| --------------------- | -------------------- | ---------------------------------------------- |
| `font-family`         | `'Georgia', serif`   | 基础字体族（未设置时，标题和内容将使用此字体） |
| `title-font-family`   | `var(--font-family)` | 名字 (h1) 和章节标题 (h2) 的字体               |
| `content-font-family` | `var(--font-family)` | 正文、条目标题 (h3)、列表项等的字体            |
| `font-size`           | `11pt`               | 基础字体大小（建议 10–12pt）                   |
| `line-height`         | `1.35`               | 行高比例                                       |

### 颜色 (Colors)

| 变量               | 默认值    | 描述         |
| ------------------ | --------- | ------------ |
| `text-color`       | `#333`    | 主要文本颜色 |
| `muted-color`      | `#555`    | 次要文本颜色 |
| `accent-color`     | `inherit` | 强调色       |
| `link-color`       | `#0563bb` | 链接颜色     |
| `background-color` | `#fff`    | 页面背景色   |

### 标题 (Headings)

| 变量                   | 默认值                                 | 描述                                                  |
| ---------------------- | -------------------------------------- | ----------------------------------------------------- |
| `name-size`            | `1.85rem`                              | 名字 (h1) 字体大小                                    |
| `name-caps`            | `normal`                               | 名字大小写 (`small-caps`, `all-small-caps`, `normal`) |
| `name-weight`          | `normal`                               | 名字字重                                              |
| `name-italic`          | `normal`                               | 名字是否斜体 (`normal`, `italic`)                     |
| `section-title-size`   | `1.22rem`                              | 章节标题 (h2) 字体大小                                |
| `section-title-caps`   | `normal`                               | 章节标题大小写                                        |
| `section-title-weight` | `bold`                                 | 章节标题字重                                          |
| `section-title-color`  | `var(--text-color)`                    | 章节标题颜色                                          |
| `section-title-border` | `1px solid var(--section-title-color)` | 章节标题下划线边框                                    |
| `header-align`         | `center`                               | 头部对齐方式 (`left`, `center`, `right`)              |
| `section-title-align`  | `left`                                 | 章节标题对齐方式                                      |
| `entry-title-size`     | `1.05rem`                              | 条目标题 (h3) 字体大小                                |
| `entry-title-weight`   | `bold`                                 | 条目标题字重                                          |

### 链接 (Links)

| 变量             | 默认值 | 描述                                 |
| ---------------- | ------ | ------------------------------------ |
| `link-underline` | `none` | 链接下划线样式 (`underline`, `none`) |

### 间距 (Spacing)

| 变量            | 默认值  | 描述                                                       |
| --------------- | ------- | ---------------------------------------------------------- |
| `page-margin-x` | `0.5in` | 水平页面边距                                               |
| `page-margin-y` | `0.5in` | 垂直页面边距                                               |
| `gap`           | `1`     | 所有垂直间距的无单位缩放因子                               |
| `section-gap`   | `10px`  | 章节之间的间距 (通过 `gap` 缩放)                           |
| `entry-gap`     | `5px`   | 条目之间的间距 (通过 `gap` 缩放)                           |
| `row-gap`       | `2px`   | 列表项、定义列表行和表格行之间的垂直间距 (通过 `gap` 缩放) |
| `col-gap`       | `12px`  | 定义列表和表格的列间距                                     |
| `list-indent`   | `1.2em` | 列表缩进                                                   |

### 列表 (Lists)

| 变量           | 默认值 | 描述                                                |
| -------------- | ------ | --------------------------------------------------- |
| `bullet-style` | `disc` | 列表项符号样式 (`disc`, `circle`, `square`, `none`) |

### 特性 (Features)

| 变量    | 默认值   | 描述                        |
| ------- | -------- | --------------------------- |
| `icons` | `inline` | 图标显示 (`inline`, `none`) |

## 样式方案 (Style Recipes)

一些只需通过变量覆盖即可创造独特外观的 `style:` 代码片段。

### 经典衬线体 (默认)

```yaml
style:
  font-family: "'Georgia', serif"
  header-align: center
  name-caps: normal
```

无需覆盖，这就是开箱即用的默认效果。

### 苏黎世 (Zurich)

温暖的衬线字体，名字使用小型大写字母，章节标题使用强调色。

```yaml
style:
  font-family: "'Palatino Linotype', Palatino, Georgia, serif"
  accent-color: '#c43218'
  name-caps: small-caps
  section-title-color: var(--accent-color)
  section-title-border: 1.5px solid var(--section-title-color)
```

### 西雅图 (Seattle)

干净的无衬线字体，左对齐头部，柔和的章节边框。

```yaml
style:
  font-family: "'Arial', 'Helvetica Neue', sans-serif"
  text-color: '#2d3748'
  section-title-border: 2px solid #b0b5be
  header-align: left
  bullet-style: circle
```

### 极简 (Minimal)

无章节边框，紧凑的间距，全大写的章节标题。

```yaml
style:
  section-title-border: none
  section-title-caps: uppercase
  section-gap: 6px
  entry-gap: 3px
```

### 现代粗体 (Bold Modern)

强烈的对比度和充满活力的强调色。

```yaml
style:
  font-family: "'Inter', 'Segoe UI', sans-serif"
  accent-color: '#2563eb'
  name-weight: bold
  section-title-color: var(--accent-color)
  link-color: var(--accent-color)
```
