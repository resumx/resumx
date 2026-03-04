# 快速開始 (Quick Start)

在不到一分鐘內從零開始渲染出一份履歷。

## 1. 安裝

```bash
npm install -g @resumx/resumx
```

Resumx 使用 Playwright 的 Chromium 來渲染 PDF。安裝完成後，請執行：

```bash
npx playwright install chromium
```

### 可選相依套件

若要**匯出為 DOCX** (`--format docx`)，請安裝 pdf2docx：

```bash
# 使用 pip
pip install pdf2docx

# 使用 pipx
pipx install pdf2docx

# 使用 uv
uv tool install pdf2docx
```

## 2. 建立與渲染

```bash
resumx init resume.md  # 產生履歷範本
resumx resume.md       # 渲染為 PDF
```

<!-- TODO: Terminal screenshot showing the output of resumx init and resumx resume.md commands -->

## 3. 編輯

在你的編輯器中開啟 `resume.md` 並使用你的資訊進行客製化。再次執行 `resumx resume.md` 來重新渲染，或是使用 `resumx resume.md --watch` 在每次存檔時自動重新建置。

## 後續步驟

- 學習如何[使用 AI](/guide/using-ai) 來撰寫並改進你的履歷
- 查看 [Markdown 語法](/guide/markdown-syntax)參考，了解所有支援的元素
- 當你想突破預設限制時，請閱讀[客製化你的履歷](/guide/customizing-your-resume)
