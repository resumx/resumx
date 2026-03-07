# CLI 參考 (CLI Reference)

Resumx CLI 透過 `resumx` 呼叫。執行 `resumx --help` 會顯示所有指令和選項。

[[toc]]

## 渲染 (Render) - 預設行為

將 Markdown 履歷渲染為 PDF、HTML、PNG 或 DOCX。

```bash
resumx <file>
```

如果未指定檔案，預設為 `resume.md`。

### 從標準輸入讀取 (Reading from stdin)

Resumx 可以從標準輸入讀取 Markdown，支援從其他指令進行管道 (piping) 傳輸：

```bash
cat resume.md | resumx                          # 自動偵測管道輸入的 stdin
cat resume.md | resumx --format html            # 使用選項的 stdin
echo "# 快速履歷" | resumx -                    # 明確的 - 參數
git show HEAD~3:resume.md | resumx -o old       # 渲染過去某次 commit 的履歷
```

當從標準輸入讀取時，輸出檔案名稱的決定順序為：

1. Frontmatter 中的 `output`（如果存在）
2. 第一個 `# H1` 標題（例如 `# Jane Smith` 會產生 `Jane_Smith.pdf`）
3. 如果兩者都不存在，請使用 `-o` 來指定輸出名稱

`--watch` 無法與標準輸入一起使用。

### 選項 (Options)

| 參數                       | 描述                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `--css <path>`             | 自訂 CSS 檔案的路徑。可重複使用，以逗號分隔。                                                  |
| `-o, --output <value>`     | 輸出路徑：名稱、目錄（結尾需加上 `/`）或包含 `{view}`/`{lang}`/`{format}` 的樣板。             |
| `-f, --format <name>`      | 輸出格式：`pdf`、`html`、`docx`、`png`。可重複使用，以逗號分隔。                               |
| `-s, --style <name=value>` | 覆寫樣式屬性。可重複使用。                                                                     |
| `-l, --lang <tag>`         | 僅產生特定語言。可重複使用，以逗號分隔（BCP 47 語言標籤）。                                    |
| `-p, --pages <number>`     | 目標頁數。如果內容過多將自動縮小以適應；如果是 `1`，也會自動填滿剩餘空間。                     |
| `--for <name-or-glob>`     | 標籤視圖名稱、自訂視圖名稱、glob 模式或代表預設視圖的 `default`。請參見 [視圖](/guide/views)。 |
| `-v, --var <key=value>`    | 覆寫樣板變數。可重複使用。                                                                     |
| `--hide <list>`            | 隱藏輸出中的區塊（以逗號分隔的 [`data-section`](/guide/semantic-selectors) 值）。              |
| `--pin <list>`             | 依指定順序將區塊釘選至頂部（以逗號分隔的 [`data-section`](/guide/semantic-selectors) 值）。    |
| `--bullet-order <value>`   | 項目符號排序方式：`none` (預設) 或 `tag`。請參見 [視圖](/guide/views#bullet-order)。           |
| `-w, --watch`              | 監聽檔案變更並自動重新建立。                                                                   |
| `--check`                  | 僅進行驗證，不進行渲染。如果發現嚴重問題，退出碼為 1。                                         |
| `--no-check`               | 完全跳過驗證。                                                                                 |
| `--strict`                 | 如果驗證有任何錯誤則失敗。這會阻止渲染（或與 `--check` 搭配時以 exit 1 退出）。                |
| `--min-severity <level>`   | 要顯示的最低嚴重程度：`critical`、`warning`、`note`、`bonus`。預設：`bonus`。                  |

### 範例 (Examples)

```bash
# 基本渲染至 PDF
resumx resume.md

# 自訂 CSS 檔案
resumx resume.md --css my-styles.css

# 自訂輸出名稱
resumx resume.md --output John_Doe_Resume

# 覆寫樣式屬性
resumx resume.md --style font-family="Inter, sans-serif" --style accent-color="#2563eb"

# 多種格式
resumx resume.md --format pdf,html,docx

# 適應 1 頁（自動縮小並填滿）
resumx resume.md --pages 1

# 監聽模式
resumx resume.md --watch

# 渲染自訂視圖
resumx resume.md --for stripe-swe

# 渲染標籤（使用隱式的標籤視圖）
resumx resume.md --for frontend

# 渲染符合 glob 模式的所有視圖
resumx resume.md --for 'stripe-*'

# 渲染所有發現的自訂視圖
resumx resume.md --for '*'

# 使用自訂視圖檔案
resumx resume.md --for ./tmp/stripe.view.yaml

# 覆寫變數
resumx resume.md --for stripe-swe -v tagline="串流處理, Go, Kafka"

# 隱藏特定區塊
resumx resume.md --hide publications,volunteer

# 釘選區塊至頂部
resumx resume.md --pin skills,work

# 臨時視圖 (不修改檔案)
resumx resume.md --for backend -v tagline="串流處理, Go" --pin skills,work -o stripe.pdf

# 僅驗證 (不渲染)
resumx resume.md --check

# 不進行驗證就渲染
resumx resume.md --no-check

# 嚴格模式: 驗證，僅在完全通過時渲染
resumx resume.md --strict

# 過濾驗證輸出
resumx resume.md --check --min-severity warning
```

## init 指令

從起始樣板建立新的履歷。

```bash
resumx init [filename]
```

| 參數       | 預設值      | 描述               |
| ---------- | ----------- | ------------------ |
| `filename` | `resume.md` | 新履歷檔案的名稱。 |

| 參數      | 描述                       |
| --------- | -------------------------- |
| `--force` | 不需提示即可覆寫現有檔案。 |

### 範例

```bash
resumx init                    # 建立 resume.md
resumx init my-resume.md       # 建立 my-resume.md
resumx init resume.md --force  # 如果已存在則覆寫
```

## 輸出格式 (Output Formats)

| 格式 | 參數                  | 備註                                                             |
| ---- | --------------------- | ---------------------------------------------------------------- |
| PDF  | `--format pdf` (預設) | 透過 Chromium 渲染，A4 頁面尺寸                                  |
| HTML | `--format html`       | 內嵌 CSS 的獨立檔案                                              |
| PNG  | `--format png`        | A4 視窗大小 (794 × 1123 px)                                      |
| DOCX | `--format docx`       | 透過 PDF 中介格式轉換 — 需要 `pdf2docx` (`pip install pdf2docx`) |

格式可使用逗號分隔：`--format pdf,html,docx`。

## Frontmatter 配置

某些 CLI 選項也可以在履歷的 YAML 或 TOML frontmatter 中進行設置，或者在 [視圖](/guide/views) 中設定。CLI 參數會形成一個 [臨時視圖](/guide/views#ephemeral-views)，它會覆寫作用中的標籤視圖或自訂視圖，而這些視圖又會覆寫 [預設視圖](/guide/views#default-view)（frontmatter 渲染欄位）。

```yaml
---
pages: 1
output: ./dist/John_Doe-{view}
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
---
```

請參見 [Frontmatter 參考](/guide/frontmatter-reference) 了解完整的欄位清單、類型、預設值與驗證選項。

## 輸出命名 (Output Naming)

若沒有設定 `-o` 參數或 `output` frontmatter，檔案名稱會自動決定：

| 情境               | 輸出                     |
| ------------------ | ------------------------ |
| 無視圖，無多語言   | `resume.pdf`             |
| 有標籤/視圖        | `resume-frontend.pdf`    |
| 有多語言           | `resume-en.pdf`          |
| 標籤/視圖 + 多語言 | `frontend/resume-en.pdf` |

如需自訂命名，請將 `-o` 參數搭配樣板變數使用：

```bash
# 包含視圖名稱變數的樣板
resumx resume.md -o "John_Doe-{view}" --for frontend
# → John_Doe-frontend.pdf

# 包含視圖與語言的樣板
resumx resume.md -o "{view}/John_Doe-{lang}" --for frontend --lang en,fr
# → frontend/John_Doe-en.pdf, frontend/John_Doe-fr.pdf
```

有關樣板變數與模式的完整詳細資訊，請參閱 [Frontmatter 參考](/guide/frontmatter-reference#output)。
