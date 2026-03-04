# 自訂 CSS (Custom CSS)

如果您需要的樣式超出了 [Tailwind 實用類別](/guide/tailwind-css)和 [樣式選項](/guide/style-options)所能提供的範圍，您可以直接撰寫自訂 CSS。

## 內聯樣式區塊 (Inline Style Block)

在您的 Markdown 中加入 `<style>` 標籤，即可進行客製化，無須額外建立檔案。

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

內聯樣式會與預設樣式一併套用，而不會取代它們。

## 自訂 CSS 檔案 (Custom CSS File)

您的 CSS 會層疊在預設樣式表之上，因此您只需撰寫需要覆寫的部分：

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

您可以將多個 CSS 檔案以陣列形式傳入。它們會依序組合，越後面的檔案優先級越高：

```yaml
css: [base-company.css, role-specific.css]
```

### 內建通用模組 (Bundled Common Modules)

如果您需要從頭建立樣式表，您的 CSS 檔案可以 `@import` 任何內建的通用模組。無論您的 CSS 檔案位於何處，它們都會自動解析。

| 模組                   | 用途                                           |
| ---------------------- | ---------------------------------------------- |
| `common/base.css`      | 重置 (Reset)、排版、間距、頁面版面佈局         |
| `common/icons.css`     | 圖示大小與對齊                                 |
| `common/utilities.css` | 實用類別 (`.small-caps`, `.sr-only`, `.max-N`) |

如果想針對特定區塊、項目或標頭欄位設定樣式，請參閱 [語意化選擇器 (Semantic Selectors)](/guide/semantic-selectors)。
