# 图标

::: info
某些图标在首次使用时可能需要**网络访问**。Resumx 会缓存获取到的图标，因此之后的渲染通常无需网络访问即可进行。
:::

使用 `:icon:` 和 `:emoji:` 语法在内联文本中添加图标和表情符号。

## 内置图标 {#built-in-icons}

使用 `:icon-name:` 语法在文本中嵌入内联图标。Resumx 附带了流行公司、工具和技术的内置图标。通过 slug 名称使用它们：

```markdown
:react: :docker: :aws: :python: :openai:
```

点击下面的任何图标以复制其 `:slug:` 语法。

<IconGallery />

## Iconify 图标 {#iconify-icons}

使用 [Iconify](https://iconify.design/) 格式的 `set/name` 语法访问超过 200,000 个图标：

- `:devicon/react:` -- <img src="/icons/devicon:react.svg" alt="devicon/react" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `:logos/kubernetes:` -- <img src="/icons/logos:kubernetes.svg" alt="logos/kubernetes" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `:simple-icons/docker:` -- <img src="/icons/simple-icons:docker.svg" alt="simple-icons/docker" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `:mdi/work:` -- <img src="/icons/mdi:work.svg" alt="mdi/work" style="display: inline-block; height: 1.25em; vertical-align: text-top;">

在 [icon-sets.iconify.design](https://icon-sets.iconify.design/) 浏览所有可用图标。

## 自定义图标 (Frontmatter) {#custom-icons}

在 frontmatter 中使用 `icons` 字段定义自定义图标。每个键都是图标 slug，值可以是 SVG 字符串、URL 或 base64 data URI。

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

### 值格式

| 格式   | 示例                            | 描述                        |
| ------ | ------------------------------- | --------------------------- |
| SVG    | `<svg>...</svg>`                | 原始 SVG 标记，内联渲染     |
| URL    | `https://example.com/logo.svg`  | 远程图片，包装在 `<img>` 中 |
| Base64 | `data:image/svg+xml;base64,...` | Data URI，包装在 `<img>` 中 |

### 优先级

Frontmatter 图标具有**最高优先级**，并且会覆盖具有相同名称的内置图标和 Iconify 图标。这让你能够替换任何默认图标：

```markdown
---
icons:
  react: '<svg xmlns="http://www.w3.org/2000/svg"><circle fill="red" r="10"/></svg>'
---

:react: <!-- 使用你的自定义 SVG 代替内置的 React 图标 -->
```

### 解析顺序

当解析 `:name:` 时，Resumx 会按以下顺序检查这些来源：

1. **Frontmatter 图标** -- 你的文档 frontmatter 中的自定义 `icons`
2. **内置图标** -- Resumx 附带的捆绑 SVG
3. **Iconify** -- 通过 Iconify API 获取的远程图标（对于 `prefix/name` 格式）
4. **Emoji** -- 标准表情符号简码（例如，`:rocket:`，`:star:`）

## Emoji {#emoji}

`:name:` 语法兼作表情符号简码支持。如果没有匹配的图标，Resumx 会回退到标准表情符号简码：

```markdown
:rocket: :star: :fire: :100:
```

这意味着如果没有名为 `rocket` 的图标，`:rocket:` 将渲染为火箭表情符号。如果内置或自定义图标与表情符号简码具有相同的名称，则图标优先级更高。

## 自动图标 {#auto-icons}

指向已识别域名的链接会自动获得其官方平台图标。不需要任何语法 —— 像平常一样编写链接即可。

```markdown
[jane@example.com](mailto:jane@example.com) | [linkedin.com/in/jane](https://linkedin.com/in/jane) | [github.com/jane](https://github.com/jane)
```

上面的每个链接都将以适当的图标（电子邮件、LinkedIn、GitHub）作为前缀。

### 支持的域名

| 域名                           | 图标                |
| ------------------------------ | ------------------- |
| `mailto:`                      | 电子邮件            |
| `tel:`                         | 电话                |
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

### 禁用自动图标

将 `icons` 样式属性设置为 `none` 以隐藏所有自动图标：

```markdown
---
style:
  icons: none # inline (默认) | none
---
```

或者通过 CLI：

```bash
resumx resume.md --style icons=none
```
