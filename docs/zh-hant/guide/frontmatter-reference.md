# Frontmatter 參考指南

透過 YAML 或 TOML frontmatter，直接在你的履歷中設定渲染選項。CLI 標籤 (flags) 的優先級高於 frontmatter 的值。

## 語法

### YAML

```yaml
---
pages: 1
output: ./dist/John_Doe-{view}
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
---
```

### TOML

```toml
+++
pages = 1
output = "./dist/John_Doe-{view}"

[style]
font-family = "Inter, sans-serif"
accent-color = "#2563eb"
+++
```

YAML 使用 `---` 分隔符號；TOML 使用 `+++`。兩者皆完全支援，你可以選擇自己喜歡的格式。

## 渲染欄位 (預設視圖)

這些欄位構成了[預設視圖 (Default View)](/guide/views#default-view)，也就是套用於每次渲染的基礎設定。標籤視圖 (Tag views)、自訂視圖 (Custom views) 及臨時視圖 (Ephemeral views) 會覆寫這些值。

### `css`

除了預設樣式外，要載入的自訂 CSS 檔案路徑。指定多個檔案時，將依序載入。

| 屬性         | 值                     |
| ------------ | ---------------------- |
| **型別**     | `string` 或 `string[]` |
| **預設值**   | 無 (使用內建預設樣式)  |
| **CLI 標籤** | `--css <path>`         |

單一字串會自動標準化為單元素的陣列。

**優先級：** CLI > frontmatter。

```yaml
# 單一 CSS 檔案
css: my-styles.css

# 多個 CSS 檔案
css: [base.css, overrides.css]
```

### `output`

渲染檔案的輸出路徑。根據其值支援三種模式：

| 屬性         | 值                                                     |
| ------------ | ------------------------------------------------------ |
| **型別**     | `string`                                               |
| **預設值**   | 當前目錄下的輸入檔名 (例如 `resume.md` → `resume.pdf`) |
| **CLI 標籤** | `-o, --output <value>`                                 |

**模式：**

| 值                              | 模式   | 行為                                                       |
| ------------------------------- | ------ | ---------------------------------------------------------- |
| `./dist/`                       | 目錄   | 以 `/` 結尾，輸出檔案會根據預設命名規則放入此目錄中        |
| `John_Doe`                      | 純名稱 | 不含 `{…}`，用作基礎檔名，並自動加上標籤/語言後綴          |
| `./dist/John_Doe-{view}-{lang}` | 模板   | 包含 `{view}`、`{lang}` 和/或 `{format}`，會為每個組合展開 |

**模板變數：**

- `{view}` — 標籤或視圖名稱 (例如 `frontend`、`stripe-swe`)。在未加上 `--for` 渲染時會展開為空字串；多餘的分隔符號會自動清理。
- `{lang}` — 語言標籤 (例如 `en`、`fr`)。當沒有語言存在時會展開為空字串。
- `{format}` — 輸出格式 (例如 `pdf`、`html`)。用於按格式將輸出整理到不同目錄。

使用模板模式時，如果展開的路徑會產生重複的檔名，將拋出錯誤並提供建議。

```yaml
# 純名稱，產生 John_Doe.pdf
output: John_Doe

# 目錄，在 ./dist/ 中使用預設名稱
output: ./dist/

# 模板，產生 ./dist/John_Doe-frontend.pdf 等
output: ./dist/John_Doe-{view}

# 包含兩者的模板，產生 frontend/John_Doe-en.pdf 等
output: "{view}/John_Doe-{lang}"

# 包含目錄與名稱的路徑
output: ./dist/John_Doe
```

### `pages`

目標頁數。設定後，Resumx 會自動調整樣式選項 (間距、行高、字體大小、邊距) 以將你的履歷縮放至指定的頁數內。

| 屬性         | 值                 |
| ------------ | ------------------ |
| **型別**     | 正整數             |
| **預設值**   | 無頁數限制         |
| **CLI 標籤** | `--pages <number>` |

**行為：**

- **縮放至適應 (Shrink to fit)**：透過四個階段的瀑布流程，逐步減少間距、行高、字體大小和邊距，直到內容符合目標頁數為止。一旦達到目標，調整就會停止 — 不會進行不必要的縮減。
- **單頁填滿 (Single-page fill)** (僅限 `pages: 1`)：如果內容在單頁中有剩餘空間，間距會被放大 (最多至原始值的 1.5 倍) 以填滿頁面。這僅適用於單頁履歷，避免底部留白看起來像是不小心造成的。
- **最低可讀性限制**：變數永遠不會縮減至安全最小值以下 (例如字體大小：9pt，行高：1.15，區塊間距：4px)。如果內容即使在最小值也無法容納，履歷將按原樣渲染並顯示警告。

縮減階段會依視覺影響程度 (最不顯眼的優先) 依序進行：

1. **間距 (Gaps)** — row-gap, entry-gap, section-gap
2. **行高 (Line height)** — 無單位的行高比例
3. **字體大小 (Font size)** — 以 pt 為單位
4. **邊距 (Margins)** — page-margin-x 與 page-margin-y (最後手段)

**優先級：** CLI > frontmatter。

```yaml
# 將履歷精確調整為 1 頁 (縮放 + 填滿)
pages: 1

# 將履歷調整為最多 2 頁 (僅縮放)
pages: 2
```

::: tip
當設定 `pages:` 時，`style:` 的值會被視為**起始點**。限制引擎可能會將它們朝全域最小值縮減。如果你希望嚴格控制樣式，不進行任何自動調整，請不要使用 `pages:`。
:::

請參閱 [頁面適應 (Fit to Page)](/guide/fit-to-page) 取得完整指南。

### `sections`

控制顯示哪些區塊以及它們的排序。包含兩個子欄位：`hide` 與 `pin`。

| 屬性         | 值                                                                   |
| ------------ | -------------------------------------------------------------------- |
| **型別**     | `{ hide?: string[], pin?: string[] }`                                |
| **預設值**   | 依原始碼順序顯示所有區塊                                             |
| **CLI 標籤** | `--hide <sections>`、`--pin <sections>` (以逗號分隔)                 |
| **可用值**   | [`data-section`](/guide/semantic-selectors#sections) 類型 (參見下表) |

- **`hide`** 會從輸出中移除列出的區塊。未被隱藏的所有內容預設會依原始碼順序渲染。在履歷中加入新區塊意味著它會出現在所有地方，除非你明確隱藏它。
- **`pin`** 會將列出的區塊移至文件頂部，並依指定順序排列。未被置頂的區塊會維持其原始的原始碼順序。頁首 (header) 則始終都會渲染。

```yaml
sections:
  hide: [publications, volunteer]
  pin: [skills, work]
```

**有效的區塊類型：**

`basics`, `work`, `volunteer`, `education`, `awards`, `certificates`, `publications`, `skills`, `languages`, `interests`, `references`, `projects`

如果你使用了常見的同義詞 (例如使用 `experience` 而非 `work`)，錯誤訊息會建議你使用標準名稱。

一個區塊不能同時出現在 `hide` 和 `pin` 中。如果同時出現，Resumx 會拋出錯誤。

**優先級：** CLI > 視圖 (view) > frontmatter。在層疊過程中，每個子欄位會獨立替換：在子視圖中設定 `sections: { pin: [skills] }` 只會替換 `pin`，而父層的 `hide` 會被保留。

請參閱 [視圖：區塊 (Views: Sections)](/guide/views#sections) 取得完整指南。

### `bullet-order`

控制使用標籤或視圖渲染時，每個區塊內項目的排序方式。

| 屬性         | 值                       |
| ------------ | ------------------------ |
| **型別**     | `none` \| `tag`          |
| **預設值**   | `none`                   |
| **CLI 標籤** | `--bullet-order <value>` |

**值：**

| 值     | 行為                                                                    |
| ------ | ----------------------------------------------------------------------- |
| `none` | 文件順序，與 markdown 中編寫的順序相同。                                |
| `tag`  | 帶有標籤的項目會提升至頂部，並根據群組中 `selects` 宣告的順序進行排序。 |

可設定為基礎預設值套用於所有視圖，或在每個視圖中覆寫。

```yaml
bullet-order: tag
```

請參閱 [視圖：項目排序 (Views: Bullet Order)](/guide/views#bullet-order) 取得完整指南。

### `tags`

標籤組合與[標籤視圖 (tag view)](/guide/views#tag-views) 設定。將組合標籤定義為組成標籤的聯集，並可選擇性地設定其隱含的標籤視圖。當渲染一個組合標籤時，標有任何其組成標籤的內容都會被包含在內。使用 `--for <name>` 來渲染標籤視圖。

| 屬性       | 值                                      |
| ---------- | --------------------------------------- |
| **型別**   | `Record<string, string[] \| TagConfig>` |
| **預設值** | 無組合標籤                              |

**簡寫** (僅組合)：

```yaml
tags:
  fullstack: [frontend, backend]
  tech-lead: [backend, leadership]
  startup-cto: [fullstack, leadership, architecture]
```

**完整展開** (組合 + 標籤視圖設定)：

```yaml
tags:
  frontend:
    sections:
      hide: [publications]
      pin: [skills, projects]
    pages: 1

  fullstack:
    extends: [frontend, backend]
    sections:
      pin: [work, skills]
    pages: 2
```

簡寫 `fullstack: [frontend, backend]` 是 `fullstack: { extends: [frontend, backend] }` 的語法糖。

組合標籤可以參照其他組合標籤 (遞迴展開)。循環參照會產生錯誤。每個組成標籤都必須作為內容標籤 (`{.@name}`) 或另一個組合標籤存在於履歷中。拼寫錯誤會產生錯誤，並附帶 Levenshtein 距離的建議。

組成標籤可以是[階層式標籤](/guide/tags#hierarchical-tags)，如 `backend/node`。當展開時，會包含每個組成標籤的整個世系 (祖先 + 自身 + 後代)：

```yaml
tags:
  stripe: [frontend, backend/node]
  # 展開為: @frontend (+ @frontend/* 後代)
  #        + @backend (祖先) + @backend/node (自身)
  #        + 未標記內容
```

請參閱 [標籤 (Tags)](/guide/tags) 了解標記語法、組合、階層式標籤及標籤視圖。請參閱 [視圖 (Views)](/guide/views) 了解自訂視圖與臨時視圖。

### `vars`

可以在履歷主體中使用 <code v-pre>{{ name }}</code> 語法參照的模板變數。變數提供了一種方式，讓你可以為每個申請注入特定內容 (例如標語、關鍵字行)，而無需修改履歷主體。

| 屬性         | 值                       |
| ------------ | ------------------------ |
| **型別**     | `Record<string, string>` |
| **預設值**   | 無變數                   |
| **CLI 標籤** | `-v, --var <key=value>`  |

此處定義的變數作為基礎預設值。它們可被[視圖](/guide/views)的 `vars` 或 CLI 的 `-v` 標籤覆寫。

**優先級：** CLI > 視圖 > frontmatter。

```yaml
vars:
  tagline: '擁有 8 年經驗的全端工程師'
  keywords: ''
```

在履歷主體中：

```markdown
{{ tagline }}
```

當變數未定義或為空時，<code v-pre>{{ }}</code> 佔位符不會產生任何內容 (該行會從輸出中移除)。變數值可以包含 markdown 格式，且會正常渲染。

定義了變數但在文件中沒有對應的佔位符，將會產生錯誤。

請參閱 [視圖：變數 (Views: Variables)](/guide/views#variables) 取得完整指南。

### `icons`

自訂圖示定義。鍵值是可與 `:slug:` 語法一起使用的圖示 slug；值為 SVG 字串、URL 或 base64 data URI。

| 屬性       | 值                       |
| ---------- | ------------------------ |
| **型別**   | `Record<string, string>` |
| **預設值** | 無自訂圖示               |

Frontmatter 圖示會覆寫具有相同 slug 的內建及 Iconify 圖示。

```yaml
icons:
  mycompany: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
  partner: 'https://example.com/partner-logo.svg'
  badge: 'data:image/svg+xml;base64,PHN2Zz4uLi48L3N2Zz4='
```

請參閱 [圖示 (Icons)](/guide/icons#custom-icons) 取得詳細資訊。

### `extra`

任意使用者定義的資料。將其用於不屬於內建 schema 任何部分的自訂欄位 (例如姓名、目標職位、公司)。值可以是字串、數字、布林值、陣列或巢狀物件。

| 屬性       | 值                        |
| ---------- | ------------------------- |
| **型別**   | `Record<string, unknown>` |
| **預設值** | 無自訂資料                |

未知的頂層欄位將會被拒絕並產生錯誤。`extra` 是唯一可以用來放置自訂資料的地方。

```yaml
extra:
  name: Jane Smith
  target-role: Senior SWE
  companies:
    - Acme Corp
    - Globex
```

```toml
[extra]
name = "Jane Smith"
target-role = "Senior SWE"
companies = ["Acme Corp", "Globex"]
```

### `style`

套用於預設值之上的樣式覆寫。鍵值對應至生成 CSS 中的 `--key` (例如 `font-family` -> `--font-family`)。

| 屬性         | 值                         |
| ------------ | -------------------------- |
| **型別**     | `Record<string, string>`   |
| **預設值**   | 無覆寫                     |
| **CLI 標籤** | `-s, --style <name=value>` |

**優先級：** CLI > frontmatter

```yaml
style:
  font-family: 'Inter, sans-serif'
  accent-color: '#2563eb'
  font-size: '10pt'
```

請參閱 [樣式選項 (Style Options)](/guide/style-options#options-reference) 參考取得完整清單。

## Validate 欄位

這些欄位用於設定驗證功能 (預設會在渲染前執行，也可透過 `--check` 獨立執行)。它們被放置在 `validate` 鍵下，且與上述的渲染欄位分開。

### `validate.extends`

要使用的基礎驗證預設集。

| 屬性       | 值                                         |
| ---------- | ------------------------------------------ |
| **型別**   | `string`                                   |
| **預設值** | `recommended`                              |
| **可用值** | `recommended`, `minimal`, `strict`, `none` |

**預設集：**

| 預設集        | 包含的規則                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `recommended` | `missing-name`, `missing-contact`, `no-sections`, `no-entries`, `empty-bullet`, `long-bullet`, `single-bullet-section` |
| `minimal`     | `missing-name`, `missing-contact`, `no-sections`, `no-entries`, `empty-bullet`                                         |
| `strict`      | 與 `recommended` 相同 (所有規則皆以其預設嚴重性執行)                                                                   |
| `none`        | 無規則 — 驗證實際上被停用                                                                                              |

### `validate.rules`

單一規則的嚴重性覆寫。可以將任何規則設定為某個嚴重性層級或設為 `off` 以將其停用。

| 屬性           | 值                                            |
| -------------- | --------------------------------------------- |
| **型別**       | `Record<string, Severity \| 'off'>`           |
| **嚴重性層級** | `critical`, `warning`, `note`, `bonus`, `off` |

```yaml
validate:
  extends: recommended
  rules:
    long-bullet: warning # 從 critical 降級
    single-bullet-section: off # 完全停用
```

### 可用規則

| 規則                     | 預設嚴重性           | 描述                                              |
| ------------------------ | -------------------- | ------------------------------------------------- |
| `missing-name`           | `critical`           | 履歷必須包含一個 H1 標題 (你的姓名)。             |
| `missing-contact`        | `critical`           | 履歷的姓名之後必須包含聯絡資訊 (電子郵件或電話)。 |
| `no-sections`            | `critical`           | 履歷必須至少包含一個 H2 區塊。                    |
| `no-entries`             | `warning`            | 履歷應該至少包含一個 H3 項目。                    |
| `empty-bullet`           | `critical`           | 列表項目必須包含文字內容。                        |
| `long-bullet`            | `critical`/`warning` | 項目長度超過字元限制閾值。                        |
| `single-bullet-section`  | `bonus`              | 區塊內只有一個列表項目。                          |
| `unknown-fenced-div-tag` | `warning`            | 具名圍欄區塊使用了無法辨識的 HTML 標籤名稱。      |

### 完整範例

```yaml
---
pages: 1
output: ./out/Jane_Smith-{view}
bullet-order: tag
style:
  accent-color: '#0ea5e9'
tags:
  fullstack: [frontend, backend]
  leadership: false
vars:
  tagline: '擁有 8 年經驗的全端工程師'
validate:
  extends: recommended
  rules:
    long-bullet: warning
    single-bullet-section: off
extra:
  name: Jane Smith
  target-role: Senior SWE
---
```

自訂視圖定義於外部的 `.view.yaml` 檔案中。標籤視圖則是在 `tags:` 下內聯設定。請參閱 [視圖 (Views)](/guide/views) 取得完整指南。

## 欄位優先級

對於可以在多處設定的欄位，其解析順序為：

| 優先級   | 來源                              |
| -------- | --------------------------------- |
| 1 (最高) | 臨時視圖 (CLI 標籤)               |
| 2        | 標籤視圖或自訂視圖 (取解析成功者) |
| 3        | 預設視圖 (frontmatter 渲染欄位)   |
| 4 (最低) | 內建預設值                        |

## 未知欄位

任何不在已知集合 (`css`, `output`, `pages`, `sections`, `bullet-order`, `style`, `icons`, `tags`, `vars`, `validate`, `extra`) 中的頂層 frontmatter 鍵，都會產生錯誤：

```
Unknown frontmatter field 'foo'. Use 'extra' for custom fields.
```

如果未知的欄位看起來像是已知欄位的拼寫錯誤，將會顯示更具體的建議：

```
Unknown frontmatter field 'page'. Did you mean 'pages'?
```

若要儲存自訂資料，請使用 [`extra`](#extra) 欄位。
