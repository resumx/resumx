# 快速开始

不到一分钟，从零开始渲染你的简历。

## 1. 安装

```bash
npm install -g @resumx/resumx
```

Resumx 使用 Playwright 的 Chromium 来渲染 PDF。安装完成后，运行：

```bash
npx playwright install chromium
```

### 可选依赖

要支持 **DOCX 导出**（`--format docx`），请安装 pdf2docx：

```bash
# 使用 pip
pip install pdf2docx

# 使用 pipx
pipx install pdf2docx

# 使用 uv
uv tool install pdf2docx
```

## 2. 创建并渲染

```bash
resumx init resume.md  # 生成一个模板简历
resumx resume.md       # 渲染为 PDF
```

<!-- TODO: Terminal screenshot showing the output of resumx init and resumx resume.md commands -->

## 3. 编辑

在你的编辑器中打开 `resume.md` 并填入你的信息。再次运行 `resumx resume.md` 来重新渲染，或者使用 `resumx resume.md --watch` 在每次保存时自动重建。

## 下一步

- 了解如何[使用 AI](/guide/using-ai) 编写和改进你的简历
- 查看 [Markdown 语法](/guide/markdown-syntax) 参考了解所有支持的元素
- 当你需要超出默认设置的进阶调整时，阅读[自定义你的简历](/guide/customizing-your-resume)
