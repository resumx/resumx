<p align="center">
  <a href="README.md">English</a> | <strong>简体中文</strong> | <a href="README.zh-Hant.md">繁體中文</a>
</p>

![Resumx OG Image](https://raw.githubusercontent.com/resumx/resumx/HEAD/.github/resumx-og-image.png)

---

<p align="center">
  <a href="https://www.npmjs.com/package/@resumx/resumx"><img src="https://img.shields.io/npm/v/@resumx/resumx?color=blue" alt="npm version"></a>
</p>

<p align="center">
  <a href="https://resumx.dev/"><strong>文档</strong></a> | 
  <a href="https://resumx.dev/playbook/resume-length.html"><strong>简历指南</strong></a>
</p>

量身定制的简历能带来 [10 倍以上的面试机会](https://resumx.dev/playbook/tailored-vs-generic.html)，但大多数人往往会跳过这一步，因为这意味着需要管理多个文件，并且还要重新排版以把所有内容挤到一页内。Resumx 让你可以使用单一文件为每个职位定制内容，并根据你设置的页数自动调整内容的排版。

- **始终完美契合页面：** 设置 `pages: 1`，你可以随意增删内容，Resumx 会自动缩放排版和间距，确保内容始终刚好填满一页。
- **无额外负担的职位定制：** 在同一个文件中管理多个职位变体（例如 `{.@frontend}`、`{.@backend}`）。
- **内置 AI Agent Skills：** 自带了 [Agent Skills](https://resumx.dev)，使得 OpenClaw、Claude Code 以及其他所有 AI 助手都能理解 Resumx 语法，并遵循最佳实践进行编写。
- **30+ 样式选项：** 可直接通过 frontmatter 调整颜色、字体、间距、列表样式等，无需编写 CSS。
- **在 HR 发现前拦截错误：** 内置的校验规则会在你投递简历前，标记出缺乏亮点的经历描述、缺失的信息以及格式问题。

<!-- prettier-ignore-start -->
```markdown
---
pages: 1
tags:
  fullstack: [frontend, backend]
style:
  section-title-color: "#c43218"
---
# Jane Doe

jane@example.com | github.com/jane | linkedin.com/in/jane

{{ tagline }}

## Experience

### :meta: Meta || June 2022 - Present
_Senior Software Engineer_

- Built distributed systems serving 1M requests/day {.@backend}
- Built interactive dashboards using :ts: TypeScript {.@frontend}

## Technical Skills
::: {.@backend .grid .grid-cols-2}
- Go
- Kafka
- PostgreSQL
- Redis
:::

::: {.@frontend .grid .grid-cols-2}
- TypeScript
- React
- Vue
- PostgreSQL
:::
```
<!-- prettier-ignore-end -->

使用以下命令进行渲染：

```bash
resumx resume.md --for backend,frontend,fullstack
```

<img
  src="https://raw.githubusercontent.com/resumx/resumx/HEAD/.github/resumx-snippet-zurich-frontend.png"
  alt="针对 frontend 变体的渲染示例"
/>

### 更多功能特性

- **200k+ 图标，零配置：** 使用 `:icon-name:` 语法即可添加超过 20 万个图标。
- **内置 Tailwind CSS：** 使用 `{.class}` 语法直接在 Markdown 中应用工具类，由 Tailwind v4 即时编译。
- **实时预览：** 运行 `resumx --watch` 后，每次保存文件都会自动重新构建，你可以即时看到修改效果。
- **支持 PDF、HTML、DOCX 和 PNG：** 单一来源文件，四种输出格式。
- **按申请定制的视图：** 可以为每家公司创建 `.view.yaml` 文件，自定义标语（tagline）、内容区块顺序和标签选择，然后使用 `--for '*'` 批量渲染。
- **多语言输出：** 使用 `{lang=en}` / `{lang=fr}` 标记内容，从同一个文件生成本地化的简历。
- **模板变量：** 可以在不改动简历主体内容的情况下，替换诸如 `{{ tagline }}` 这样针对每次申请特定的文本。
- **Git 原生工作流：** 可从任何历史 commit 或 tag 进行渲染。

## 快速开始

**安装：**

```bash
npm install -g @resumx/resumx
npx playwright install chromium
```

### 可选依赖

如需导出 **DOCX 格式** (`--format docx`)，请安装 pdf2docx：

```bash
# 使用 pip
pip install pdf2docx

# 使用 pipx
pipx install pdf2docx

# 使用 uv
uv tool install pdf2docx
```

**运行：**

```bash
resumx init resume.md     # 生成简历模板
resumx resume.md --watch  # 实时预览
```

## 安装 Agent Skills

```bash
npx skills add resumx/resumx
```

这将使诸如 Cursor、Claude Code 和 Copilot 等 AI 助手能够理解并处理你的 Resumx 文件。

## CLI

| 命令                                   | 描述                   |
| -------------------------------------- | ---------------------- |
| `resumx [file]`                        | 渲染为 PDF（默认）     |
| `resumx [file] --watch`                | 实时预览               |
| `resumx [file] --css my-styles.css`    | 指定自定义 CSS 文件    |
| `resumx [file] --target frontend`      | 针对特定目标变体输出   |
| `resumx [file] --format pdf,html,docx` | 输出 PDF + HTML + DOCX |
| `resumx [file] --pages 1`              | 适应 1 页排版          |
| `resumx init`                          | 从模板创建简历         |

查看完整的 [CLI 参考指南](https://resumx.dev/guide/cli-reference.html)。

## 文档

获取完整文档，请访问 [resumx.dev](https://resumx.dev)。

## 开源协议

[Apache License 2.0](LICENSE)
