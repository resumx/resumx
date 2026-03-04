# 自定义 CSS

对于超出 [Tailwind 实用类](/guide/tailwind-css) 和 [样式选项](/guide/style-options) 范围的样式需求，你可以直接编写自定义 CSS。

## 内联样式块

在 Markdown 中添加 `<style>` 标签，无需单独创建文件即可进行自定义。

```markdown
# Jane Doe

<!-- ... -->

<style>
	h2 {
		letter-spacing: 0.05em;
	}
	section[data-section='skills'] dl {
		grid-template-columns: 1fr 1fr;
	}
</style>
```

内联样式会与默认样式一起应用，它们不会替换默认样式。

## 自定义 CSS 文件

你的 CSS 会级联到默认样式表之上，所以你只需要编写覆盖样式：

```css
/* my-styles.css */
:root {
	--font-family: 'Inter', sans-serif;
	--accent-color: #2563eb;
	--section-title-border: 2px solid var(--accent-color);
	--header-align: left;
}

h2 {
	letter-spacing: 0.05em;
}
```

在 frontmatter 或 CLI 中引用它：

```markdown
---
css: my-styles.css
---
```

```bash
resumx resume.md --css my-styles.css
```

你可以将多个 CSS 文件作为数组传递。它们将按顺序组合，后面的文件优先级更高：

```yaml
css: [base-company.css, role-specific.css]
```

### 捆绑的通用模块

如果你需要从头开始构建样式表，你的 CSS 文件可以通过 `@import` 引入任何捆绑的通用模块。无论你的 CSS 文件在哪里，它们都会自动解析。

| 模块                   | 用途                                         |
| ---------------------- | -------------------------------------------- |
| `common/base.css`      | 重置、排版、间距、页面布局                   |
| `common/icons.css`     | 图标大小和对齐                               |
| `common/utilities.css` | 实用类 (`.small-caps`, `.sr-only`, `.max-N`) |

要针对特定的部分 (sections)、条目 (entries) 和头部字段 (header fields)，请参阅 [语义选择器](/guide/semantic-selectors)。
