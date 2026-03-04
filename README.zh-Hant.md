<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a> | <strong>繁體中文</strong>
</p>

![Resumx OG Image](https://raw.githubusercontent.com/resumx/resumx/HEAD/.github/resumx-og-image.png)

---

<p align="center">
  <a href="https://www.npmjs.com/package/@resumx/resumx"><img src="https://img.shields.io/npm/v/@resumx/resumx?color=blue" alt="npm version"></a>
</p>

<p align="center">
  <a href="https://resumx.dev/"><strong>官方文件</strong></a> | 
  <a href="https://resumx.dev/playbook/resume-length.html"><strong>履歷撰寫指南</strong></a>
</p>

客製化履歷能獲得 [10 倍以上的面試機會](https://resumx.dev/playbook/tailored-vs-generic.html)，但大多數人都不會這麼做，因為這意味著要管理多個檔案，並重新排版以確保內容塞進一頁內。Resumx 讓你在單一檔案中為每個職位客製化內容，並根據你設定的頁數自動調整版面。

- **自動排版：** 設定 `pages: 1` 後，無論你怎麼新增或刪除內容，Resumx 都會自動縮放字體和間距，確保履歷精準地剛好填滿一頁。
- **低成本客製化：** 在單一檔案中透過標籤區分不同職位的內容（例如：`{.@frontend}`, `{.@backend}`）。
- **內建 AI agent skills：** 內附 [agent skills](https://resumx.dev)，讓 OpenClaw、Claude Code 及其他 AI 都能理解 Resumx 語法，並以最佳實踐為你撰寫履歷。
- **超過 30 種樣式選項：** 直接在 frontmatter 中調整顏色、字體、間距、列表樣式等，完全不需要寫 CSS。
- **內建驗證機制：** 在送出履歷前，自動標記寫得不夠好的重點、缺漏的資訊以及排版問題，讓你在招募人員發現前就先修正錯誤。

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

使用以下指令進行編譯：

```bash
resumx resume.md --for backend,frontend,fullstack
```

<img
  src="https://raw.githubusercontent.com/resumx/resumx/HEAD/.github/resumx-snippet-zurich-frontend.png"
  alt="上述程式碼的渲染結果（針對 frontend 標籤）"
/>

### 其他內建功能

- **超過 20 萬個圖示，零設定：** 使用 `:icon-name:` 語法即可加入超過 20 萬種圖示。
- **內建 Tailwind CSS：** 透過 `{.class}` 語法直接在 Markdown 中套用 utility classes，並使用 Tailwind v4 即時編譯。
- **即時預覽：** 執行 `resumx --watch`，每次存檔時都會自動重新編譯，讓你即時看到修改結果。
- **支援 PDF、HTML、DOCX 及 PNG：** 單一來源，四種輸出格式。
- **針對個別公司的 View 設定檔：** 為不同公司建立獨立的 `.view.yaml` 檔案，自訂標語 (tagline)、區塊順序以及標籤選擇，然後使用 `--for '*'` 進行批次編譯。
- **多語系輸出：** 透過 `{lang=en}` / `{lang=zh-tw}` 標註內容，即可從單一檔案產出多國語言的履歷。
- **模板變數：** 透過像 `{{ tagline }}` 這樣的變數，為不同職缺替換特定文字，無需修改履歷本文。
- **Git 原生工作流程：** 支援從任何先前的 commit 或 tag 編譯履歷。

## 快速開始

**安裝：**

```bash
npm install -g @resumx/resumx
npx playwright install chromium
```

### 選擇性依賴

若需匯出 **DOCX 格式**（`--format docx`），請安裝 pdf2docx：

```bash
# Using pip
pip install pdf2docx

# Using pipx
pipx install pdf2docx

# Using uv
uv tool install pdf2docx
```

**執行：**

```bash
resumx init resume.md     # 產生一份履歷模板
resumx resume.md --watch  # 即時預覽
```

## 安裝 Agent Skills

```bash
npx skills add resumx/resumx
```

這能讓 Cursor、Claude Code 及 Copilot 等 AI 助手理解並編輯你的 Resumx 檔案。

## CLI 命令

| 命令                                   | 說明                            |
| -------------------------------------- | ------------------------------- |
| `resumx [file]`                        | 編譯為 PDF（預設）              |
| `resumx [file] --watch`                | 即時預覽                        |
| `resumx [file] --css my-styles.css`    | 使用自訂的 CSS 檔案             |
| `resumx [file] --target frontend`      | 針對特定標籤編譯輸出            |
| `resumx [file] --format pdf,html,docx` | 同時輸出 PDF、HTML 及 DOCX 格式 |
| `resumx [file] --pages 1`              | 強制縮放至 1 頁                 |
| `resumx init`                          | 從模板建立新履歷                |

查看完整的 [CLI 參考指南](https://resumx.dev/guide/cli-reference.html)。

## 官方文件

欲查看完整文件，請前往 [resumx.dev](https://resumx.dev)。

## 授權條款

[Apache License 2.0](LICENSE)
