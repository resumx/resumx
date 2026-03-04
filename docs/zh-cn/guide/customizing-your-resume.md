# 自定义你的简历

Resumx 自动处理布局，因此大多数简历除了页面目标外不需要任何东西。当你的确需要更多控制权时，定制是渐进式的，从样式选项到 Tailwind 类，再到完全自定义的 CSS。

## 1. 适应页面

设定目标页数，Resumx 会调整间距、边距和字体大小以使其适应。轻微的溢出会缩紧间隙，只有严重的溢出才会触及你的字体大小。

```markdown
---
pages: 1
---
```

在大多数情况下不需要手动调整。有关完整详细信息，请参阅 [适应页面](/guide/fit-to-page)。

## 2. 样式选项

需要调整字体、颜色或间距？通过 frontmatter 中的 `style:` 覆盖样式属性。

```markdown
---
pages: 1
style:
  font-family: 'Inter, sans-serif'
  font-size: 10pt
  page-margin-x: 0.4in
  name-caps: small-caps
---
```

有关完整列表，请参阅 [样式选项](/guide/style-options#options-reference)。

## 3. Tailwind CSS

将 [Tailwind CSS](/guide/tailwind-css) 类应用到单个元素以进行快速的一次性样式设置：

```markdown
[React]{.bg-blue-100 .text-blue-800 .px-2 .rounded}
```

## 4. 自定义 CSS 文件

当你需要完全控制时，创建一个 CSS 文件。它会级联到默认样式表之上，所以你只需要编写覆盖样式：

```css
/* my-styles.css */
:root {
	--font-family: 'Inter', sans-serif;
	--accent-color: #2563eb;
}

h2 {
	letter-spacing: 0.05em;
}
```

在 frontmatter (`css: my-styles.css`) 或命令行 (`--css my-styles.css`) 中引用它。

你还可以直接在 Markdown 中添加一个 `<style>` 块进行快速的一次性调整：

```html
<style>
	a {
		color: #2563eb;
	}
</style>
```

有关完整指南，请参阅 [自定义 CSS](/guide/custom-css)。
