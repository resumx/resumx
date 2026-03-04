# 圖示 (Icons)

::: info
某些圖示在您第一次使用時可能需要 **網路連線**。Resumx 會快取擷取到的圖示，因此後續的渲染通常不需網路連線即可運作。
:::

使用 `:icon:` 和 `:emoji:` 語法在行內加入圖示和表情符號。

## 內建圖示 (Built-in Icons) {#built-in-icons}

使用 `:icon-name:` 語法將圖示嵌入您的文字中。Resumx 內建了知名公司、工具和技術的圖示。請透過簡稱 (slug) 來使用它們：

```markdown
:react: :docker: :aws: :python: :openai:
```

點擊下方任一圖示以複製其 `:slug:` 語法。

<IconGallery />

## Iconify 圖示 (Iconify Icons) {#iconify-icons}

使用 [Iconify](https://iconify.design/) 的 `set/name` 語法格式，可以存取超過 20 萬個圖示：

- `:devicon/react:` -- <img src="/icons/devicon:react.svg" alt="devicon/react" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `:logos/kubernetes:` -- <img src="/icons/logos:kubernetes.svg" alt="logos/kubernetes" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `:simple-icons/docker:` -- <img src="/icons/simple-icons:docker.svg" alt="simple-icons/docker" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `:mdi/work:` -- <img src="/icons/mdi:work.svg" alt="mdi/work" style="display: inline-block; height: 1.25em; vertical-align: text-top;">

您可以在 [icon-sets.iconify.design](https://icon-sets.iconify.design/) 瀏覽所有可用的圖示。

## 自訂圖示 (Frontmatter) {#custom-icons}

使用 frontmatter 中的 `icons` 欄位定義自訂圖示。每個鍵是圖示的簡稱，值可以是 SVG 字串、URL 或 base64 data URI。

```markdown
---
icons:
  mycompany: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
  partner: 'https://example.com/partner-logo.svg'
  badge: 'data:image/svg+xml;base64,PHN2Zz4uLi48L3N2Zz4='
---

# Jane Smith

Worked at :mycompany: in partnership with :partner:

Certified :badge: holder
```

### 值的格式

| 格式   | 範例                            | 描述                      |
| ------ | ------------------------------- | ------------------------- |
| SVG    | `<svg>...</svg>`                | 原始 SVG 標記，行內渲染   |
| URL    | `https://example.com/logo.svg`  | 遠端圖片，以 `<img>` 包裝 |
| Base64 | `data:image/svg+xml;base64,...` | Data URI，以 `<img>` 包裝 |

### 優先級 (Priority)

Frontmatter 中的圖示擁有 **最高優先級**，並會覆寫具有相同名稱的內建圖示與 Iconify 圖示。這讓您可以替換任何預設圖示：

```markdown
---
icons:
  react: '<svg xmlns="http://www.w3.org/2000/svg"><circle fill="red" r="10"/></svg>'
---

:react: <!-- 這將使用您的自訂 SVG，而不是內建的 React 圖示 -->
```

### 解析順序 (Resolver Order)

在解析 `:name:` 時，Resumx 會依以下順序檢查來源：

1. **Frontmatter 圖示** -- 文件 frontmatter 中的自訂 `icons`
2. **內建圖示** -- 隨 Resumx 附帶的內建 SVG
3. **Iconify** -- 透過 Iconify API 取得的遠端圖示（用於 `prefix/name` 格式）
4. **Emoji** -- 標準表情符號短代碼（例如 `:rocket:`、`:star:`）

## 表情符號 (Emoji) {#emoji}

`:name:` 語法同時支援表情符號短代碼。如果沒有匹配的圖示，Resumx 會退而使用標準的表情符號短代碼：

```markdown
:rocket: :star: :fire: :100:
```

這意味著當沒有名為 `rocket` 的圖示時，`:rocket:` 會渲染為火箭表情符號。如果內建或自訂圖示與表情符號短代碼同名，則圖示優先。

## 自動圖示 (Auto-Icons) {#auto-icons}

連結到已知網域的連結會自動獲得其官方平台圖示。無需任何語法 -- 只要寫一般的連結即可。

```markdown
[jane@example.com](mailto:jane@example.com) | [linkedin.com/in/jane](https://linkedin.com/in/jane) | [github.com/jane](https://github.com/jane)
```

上述每個連結前都會自動加上相對應的圖示（電子郵件、LinkedIn、GitHub）。

### 支援的網域

| 網域                           | 圖示                |
| ------------------------------ | ------------------- |
| `mailto:`                      | Email               |
| `tel:`                         | Phone               |
| `linkedin.com`                 | LinkedIn            |
| `github.com`                   | GitHub              |
| `gitlab.com`                   | GitLab              |
| `bitbucket.org`                | Bitbucket           |
| `stackoverflow.com`            | Stack Overflow      |
| `x.com` / `twitter.com`        | X (Twitter)         |
| `youtube.com` / `youtu.be`     | YouTube             |
| `dribbble.com`                 | Dribbble            |
| `behance.net`                  | Behance             |
| `medium.com`                   | Medium              |
| `dev.to`                       | DEV                 |
| `codepen.io`                   | CodePen             |
| `marketplace.visualstudio.com` | VS Code Marketplace |

### 停用自動圖示

將樣式屬性 `icons` 設為 `none` 即可隱藏所有自動圖示：

```markdown
---
style:
  icons: none # inline (預設) | none
---
```

或透過 CLI：

```bash
resumx resume.md --style icons=none
```
