# 自适应页数 (Fit to Page)

```markdown
---
pages: 1
---
```

设置一个目标页数。如果内容溢出，布局会自动缩放以适应；如果一页中还有剩余空间，布局会扩展间距以填充；并且它会在保证可读性的最低标准处停止缩放。

<!-- TODO: side-by-side comparison image — left: 1.1 pages without `pages:`, right: 1 page with `pages: 1` -->

## 使用方法

在你的 frontmatter 中添加 `pages`，或通过 CLI 传递它：

```bash
resumx resume.md --pages 1
```

这也适用于多页目标：`pages: 2` 可以将一份长达 2.2 页的简历自动适配为正好两页。

## 哪些会被调整

当内容溢出时，以下变量将会缩放以适应空间：

| 变量                                  | 类型     | 缩小优先级     |
| ------------------------------------- | -------- | -------------- |
| `row-gap`、`entry-gap`、`section-gap` | 间距     | 最优先 (First) |
| `page-margin-x`、`page-margin-y`      | 边距     | 其次 (Second)  |
| `font-size`、`line-height`            | 排版字体 | 最后 (Last)    |

间距缩放得最快，接下来是边距，而字体大小会抵抗更改，直到溢出非常严重时才会调整。小幅度的溢出（比如 1.05 页）只会收紧间距，完全不会触及你的字体大小。只有当溢出较大时才会开始减少边距，如果溢出严重才会缩小字体。

对于 `pages: 1`，如果内容短于一整页，间距将会扩大以填满剩余空间。

### 最小值 (Minimums)

没有任何变量会低于以下下限：

| 变量            | 下限   |
| --------------- | ------ |
| `font-size`     | 9pt    |
| `line-height`   | 1.15   |
| `section-gap`   | 4px    |
| `entry-gap`     | 1px    |
| `page-margin-y` | 0.3in  |
| `page-margin-x` | 0.35in |

如果即使达到下限，内容仍然无法达到你的目标页数：

- 如果下限能够减少总页数，系统会尽最大努力保留这些下限值。
- 如果达到下限也无法减少页数，则会保留原始布局以确保最佳的可读性。

### 与 `style:` 的交互

当设置了 `pages:` 时，`style:` 的值就是起始点，而不是下限：

```markdown
---
pages: 1
style:
  font-size: 12pt # 如有需要可能会被减小
  section-gap: 15px # 如有需要可能会被减小
---
```

引擎会根据需要从你设定的值向最小下限进行调整。如果没有设置 `pages:`，样式值将按原样应用且不会发生改变。
