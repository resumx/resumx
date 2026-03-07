# CLI 参考

Resumx CLI 通过 `resumx` 调用。运行 `resumx --help` 可以显示所有命令和选项。

[[toc]]

## Render（默认命令）

将 Markdown 简历渲染为 PDF、HTML、PNG 或 DOCX。

```bash
resumx <file>
```

如果没有指定文件，则默认使用 `resume.md`。

### 从标准输入（stdin）读取

Resumx 可以从标准输入读取 Markdown 内容，从而允许通过管道从其他命令接收数据：

```bash
cat resume.md | resumx                          # 自动检测通过管道传入的 stdin
cat resume.md | resumx --format html            # 使用选项的 stdin
echo "# Quick Resume" | resumx -               # 显式使用 - 参数
git show HEAD~3:resume.md | resumx -o old       # 从之前的 commit 渲染
```

从标准输入读取时，输出文件名由以下内容推导：

1. frontmatter 中的 `output`（如果存在）
2. 第一个 `# H1` 标题（例如 `# Jane Smith` 将生成 `Jane_Smith.pdf`）
3. 如果两者都不存在，则使用 `-o` 来指定输出名称

`--watch` 模式在读取标准输入时不可用。

### 选项

| 标志                       | 描述                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| `--css <path>`             | 自定义 CSS 文件的路径。可重复，使用逗号分隔。                                                 |
| `-o, --output <value>`     | 输出路径：名称、目录（带尾斜杠 `/`），或者带有 `{view}`/`{lang}`/`{format}` 的模板。          |
| `-f, --format <name>`      | 输出格式：`pdf`、`html`、`docx`、`png`。可重复，使用逗号分隔。                                |
| `-s, --style <name=value>` | 覆盖样式属性。可重复。                                                                        |
| `-l, --lang <tag>`         | 仅生成特定语言的简历。可重复，使用逗号分隔（BCP 47 标签）。                                   |
| `-p, --pages <number>`     | 目标页数。会自动缩放以适应；对于 `1`，还会填充剩余的空白。                                    |
| `--for <name-or-glob>`     | 标签视图名称、自定义视图名称、glob 模式或代表默认视图的 `default`。参见[视图](/guide/views)。 |
| `-v, --var <key=value>`    | 覆盖模板变量。可重复。                                                                        |
| `--hide <list>`            | 从输出中隐藏块（使用逗号分隔的 [`data-section`](/guide/semantic-selectors) 值）。             |
| `--pin <list>`             | 按指定顺序将块置顶（使用逗号分隔的 [`data-section`](/guide/semantic-selectors) 值）。         |
| `--bullet-order <value>`   | 列表项排序：`none`（默认）或 `tag`。参见[视图](/guide/views#bullet-order)。                   |
| `-w, --watch`              | 监听更改并自动重新构建。                                                                      |
| `--check`                  | 仅执行校验，不进行渲染。如果发现关键问题则以退出码 1 退出。                                   |
| `--no-check`               | 完全跳过校验。                                                                                |
| `--strict`                 | 如果校验有任何错误则失败。阻止渲染（或在使用 `--check` 时以 exit 1 退出）。                   |
| `--min-severity <level>`   | 显示的最低严重程度：`critical`、`warning`、`note`、`bonus`。默认值：`bonus`。                 |

### 示例

```bash
# 基本渲染为 PDF
resumx resume.md

# 自定义 CSS 文件
resumx resume.md --css my-styles.css

# 自定义输出名称
resumx resume.md --output John_Doe_Resume

# 覆盖样式属性
resumx resume.md --style font-family="Inter, sans-serif" --style accent-color="#2563eb"

# 多种输出格式
resumx resume.md --format pdf,html,docx

# 适应 1 页（缩放 + 填充）
resumx resume.md --pages 1

# 监听模式
resumx resume.md --watch

# 渲染自定义视图
resumx resume.md --for stripe-swe

# 渲染标签（使用隐式的标签视图）
resumx resume.md --for frontend

# 渲染匹配 glob 的所有视图
resumx resume.md --for 'stripe-*'

# 渲染发现的所有自定义视图
resumx resume.md --for '*'

# 使用自定义视图文件
resumx resume.md --for ./tmp/stripe.view.yaml

# 覆盖变量
resumx resume.md --for stripe-swe -v tagline="Stream Processing, Go, Kafka"

# 隐藏特定的块
resumx resume.md --hide publications,volunteer

# 置顶块
resumx resume.md --pin skills,work

# 临时视图（不修改文件）
resumx resume.md --for backend -v tagline="Stream Processing, Go" --pin skills,work -o stripe.pdf

# 仅校验（不渲染）
resumx resume.md --check

# 无需校验即可渲染
resumx resume.md --no-check

# 严格模式：进行校验，只有无错误时才渲染
resumx resume.md --strict

# 过滤校验输出
resumx resume.md --check --min-severity warning
```

## init

从启动模板创建一个新的简历。

```bash
resumx init [filename]
```

| 参数       | 默认值      | 描述               |
| ---------- | ----------- | ------------------ |
| `filename` | `resume.md` | 新简历文件的名称。 |

| 标志      | 描述                   |
| --------- | ---------------------- |
| `--force` | 覆盖现有文件而不提示。 |

### 示例

```bash
resumx init                    # 创建 resume.md
resumx init my-resume.md       # 创建 my-resume.md
resumx init resume.md --force  # 如果文件存在则覆盖
```

## 输出格式

| 格式 | 标志                    | 备注                                                              |
| ---- | ----------------------- | ----------------------------------------------------------------- |
| PDF  | `--format pdf` （默认） | 通过 Chromium 渲染，A4 纸张大小                                   |
| HTML | `--format html`         | 带有内嵌 CSS 的独立文件                                           |
| PNG  | `--format png`          | A4 视口（794 × 1123 像素）                                        |
| DOCX | `--format docx`         | 通过 PDF 中间格式转换 — 需要 `pdf2docx`（`pip install pdf2docx`） |

格式可以使用逗号分隔：`--format pdf,html,docx`。

## frontmatter 配置

部分 CLI 选项也可以在简历的 YAML 或 TOML frontmatter 中设置，或者在[视图](/guide/views)中设置。CLI 标志构成了一个[临时视图](/guide/views#ephemeral-views)，它会覆盖处于激活状态的标签视图或自定义视图，后者又会覆盖[默认视图](/guide/views#default-view)（frontmatter 渲染字段）。

```yaml
---
pages: 1
output: ./dist/John_Doe-{view}
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
---
```

请参阅 [frontmatter 参考](/guide/frontmatter-reference) 了解字段、类型、默认值以及验证选项的完整列表。

## 输出命名

当没有设置 `-o` 标志或未在 frontmatter 设置 `output` 时，文件名将被自动决定：

| 场景             | 输出                     |
| ---------------- | ------------------------ |
| 无视图，无语言   | `resume.pdf`             |
| 带有标签/视图    | `resume-frontend.pdf`    |
| 带有语言         | `resume-en.pdf`          |
| 标签/视图 + 语言 | `frontend/resume-en.pdf` |

对于自定义命名，请将 `-o` 标志与模板变量一起使用：

```bash
# 包含视图名称变量的模板
resumx resume.md -o "John_Doe-{view}" --for frontend
# → John_Doe-frontend.pdf

# 包含视图和语言的模板
resumx resume.md -o "{view}/John_Doe-{lang}" --for frontend --lang en,fr
# → frontend/John_Doe-en.pdf, frontend/John_Doe-fr.pdf
```

请参阅 [frontmatter 参考](/guide/frontmatter-reference#output) 了解模板变量和模式的详细信息。
