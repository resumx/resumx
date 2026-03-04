# 客製化您的履歷 (Customizing Your Resume)

Resumx 會自動處理排版，因此大多數履歷除了設定目標頁數外，不需要額外的調整。當您確實需要更多控制權時，客製化是漸進式的：從樣式選項、Tailwind 類別，到完全自訂的 CSS。

## 1. 適應頁面 (Fit to Page)

設定目標頁數，Resumx 就會調整間距、邊距和字體大小以適應頁面。輕微的溢出會縮小間距，只有嚴重的溢出才會動到您的字體大小。

```markdown
---
pages: 1
---
```

在多數情況下無需手動微調。請參閱 [適應頁面 (Fit to Page)](/guide/fit-to-page) 了解完整細節。

## 2. 樣式選項 (Style Options)

需要調整字體、顏色或間距嗎？透過 frontmatter 中的 `style:` 覆寫樣式屬性。

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

請參閱 [樣式選項 (Style Options)](/guide/style-options#options-reference) 取得完整清單。

## 3. Tailwind CSS

將 [Tailwind CSS](/guide/tailwind-css) 類別套用到個別元素上，進行快速的單次樣式設定：

```markdown
[React]{.bg-blue-100 .text-blue-800 .px-2 .rounded}
```

## 4. 自訂 CSS 檔案 (Custom CSS File)

當您需要完全的控制權時，建立一個 CSS 檔案。它會層疊在預設樣式表之上，因此您只需寫出要覆寫的部分：

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

在 frontmatter 中引用它 (`css: my-styles.css`) 或透過命令列 (`--css my-styles.css`)。

您也可以直接在 Markdown 中加入 `<style>` 區塊，進行快速的單次微調：

```html
<style>
	a {
		color: #2563eb;
	}
</style>
```

請參閱 [自訂 CSS (Custom CSS)](/guide/custom-css) 取得完整指南。
