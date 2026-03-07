# 視圖 (Views)

[標籤](/guide/tags) 用於過濾您的內容。視圖 (Views) 則配置過濾後的內容如何渲染：顯示哪些區塊、順序為何、注入哪些關鍵字、目標頁數為何。有關其思維模型，請參閱 [客製化如何運作](/guide/tailoring)。

## 四種視圖

每次渲染都會使用一個視圖。它們的區別在於存放位置以及建立它們所需的精力。

| 種類                                          | 位置                         | 性質                                 |
| --------------------------------------------- | ---------------------------- | ------------------------------------ |
| [預設視圖 (Default view)](#default-view)      | Frontmatter 渲染欄位         | 所有渲染的基礎配置                   |
| [標籤視圖 (Tag view)](#tag-views)             | Frontmatter `tags:` 展開形式 | 每個標籤的覆寫配置，每個標籤隱式擁有 |
| [自訂視圖 (Custom view)](#custom-views)       | `.view.yaml` 檔案            | 每個應用的獨立配置                   |
| [臨時視圖 (Ephemeral view)](#ephemeral-views) | CLI 參數                     | 一次性、不被持久化儲存               |

標籤視圖和自訂視圖是平級的，而非層級關係。`--for` 只會解析為其中之一，絕不會同時解析為兩者。詳情請參見 [層疊順序 (Cascade Order)](#cascade-order)。

## 預設視圖 (Default View)

Frontmatter 的渲染欄位（`pages`、`style`、`vars`、`sections`、`bullet-order`）即為預設視圖。除非被更具體的視圖覆寫，否則它們適用於每一次渲染。

```yaml
---
pages: 1
sections:
  hide: [publications]
style:
  accent-color: '#2563eb'
vars:
  tagline: '擁有 8 年經驗的全端工程師'
---
```

即使沒有 frontmatter 的履歷也擁有預設視圖，它只是對所有配置使用內建的預設值。

## 標籤視圖 (Tag Views)

每個 [標籤](/guide/tags) 都會隱式產生一個標籤視圖。在沒有配置的情況下，標籤視圖會繼承 [預設視圖](#default-view) 的所有預設值。您可以使用 frontmatter 中的展開形式來配置標籤視圖：

```yaml
---
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
---
```

簡寫 `fullstack: [frontend, backend]` 是 `fullstack: { extends: [frontend, backend] }` 的語法糖。當您需要在標籤視圖上進行渲染配置時，請使用展開形式。

配置標籤視圖不會改變標籤本身。其他標籤仍然可以組合它，內文中的 `{.@frontend}` 依然有效。標籤負責處理內容（顯示什麼），而其標籤視圖負責處理渲染（如何顯示）。

## 自訂視圖 (Custom Views)

自訂視圖存放在 `.view.yaml` 檔案中。頂層的鍵名即為視圖名稱：

```yaml
# stripe.view.yaml
stripe-swe:
  selects: [backend/node, distributed-systems, leadership]
  sections:
    hide: [publications]
    pin: [skills, work]
  vars:
    tagline: '串流處理, 事件驅動架構, Node.js, Kafka'

stripe-pm:
  selects: [frontend, leadership]
  vars:
    tagline: '產品策略, 跨職能領導'
```

Resumx 會相對於履歷檔案遞迴尋找所有 `**/*.view.yaml` 檔案。您可以自由組織：

```
resume.md
stripe-swe.view.yaml
views/
  active/
    netflix.view.yaml
  archive/
    old-google.view.yaml
```

使用 `--for` 進行渲染：

```bash
resumx resume.md --for stripe-swe
```

::: info 視圖解析
`--for` 會針對自訂視圖和標籤視圖解析名稱。如果名稱同時符合兩者，Resumx 會拋出錯誤。Glob 模式 (--for 'stripe-\*') 會比對所有具名視圖（標籤視圖和自訂視圖）。完整的 `--for` 模式列表請參見 [CLI 參考](/guide/cli-reference)。
:::

## 自訂視圖欄位

| 欄位           | 類型                     | 描述                                             |
| -------------- | ------------------------ | ------------------------------------------------ |
| `selects`      | `string[]`               | 要包含的內容標籤（聯集）。                       |
| `sections`     | `object`                 | 區塊的可見度與排序（見 [區塊](#sections)）。     |
| `pages`        | `number`                 | 目標頁數（覆寫 frontmatter 設定）。              |
| `bullet-order` | `none` \| `tag`          | 項目符號排序策略。預設為 `none`。                |
| `vars`         | `Record<string, string>` | 給 <code v-pre>{{ }}</code> 佔位符使用的變數值。 |
| `style`        | `Record<string, string>` | 樣式覆寫（同 frontmatter 的 `style`）。          |
| `css`          | `string \| string[]`     | CSS 檔案路徑或行內 CSS 字串。                    |
| `format`       | `string`                 | 輸出格式 (`pdf`、`html`、`docx`、`png`)。        |
| `output`       | `string`                 | 輸出路徑（同 frontmatter 的 `output`）。         |

基礎預設值（pages、style、bullet-order）位於 frontmatter 中。自訂視圖的欄位則是覆寫值。

### 內容過濾

沒有 `selects` 的自訂視圖不會應用任何內容過濾器。所有內容都會被渲染，無論是否有標籤。這在視圖只需要渲染配置時非常有用：

```yaml
one-pager:
  sections:
    pin: [skills, work]
  pages: 1
```

明確的空陣列 (`selects: []`) 則不同：它代表「不選擇任何標籤」，所以只有未標記的內容會出現。有標籤的內容會被移除。可以把它想像成 SQL 查詢：省略 WHERE 子句會返回所有內容，而 `WHERE tag IN ()` 什麼都匹配不到。`selects` 中的每個標籤名稱都必須作為內容標籤、組合標籤或標籤視圖存在；未知的名稱會產生錯誤，並提供可能的拼字建議。

```yaml
generic:
  selects: [] # 只有未標記的（共通）內容
  pages: 1
```

| 定義                           | 行為                              |
| ------------------------------ | --------------------------------- |
| 沒有 `selects`                 | 所有內容（無過濾）                |
| `selects: [frontend, backend]` | 未標記 + `@frontend` + `@backend` |
| `selects: []`                  | 僅限未標記內容                    |

## 變數 (Variables)

標籤過濾內容。變數則將每個應用的專屬文字注入到 <code v-pre>{{ }}</code> 佔位符中：

```markdown
# Jane Doe

jane@example.com | github.com/jane

{{ tagline }}
```

```yaml
# stripe-swe.view.yaml
stripe-swe:
  selects: [backend]
  vars:
    tagline: '專精於串流處理的後端工程師'
```

當有定義時，值會在該位置渲染。當未定義時，佔位符不會產生任何內容（不會有空白）。變數值可以包含 Markdown 格式（例如 `**粗體**`），它們會被正常渲染，因為替換發生在 Markdown 解析之前。

定義了一個變數卻沒有對應的 <code v-pre>{{ }}</code> 佔位符會報錯。

變數的解析順序為：臨時視圖（CLI `-v`） > 標籤視圖或自訂視圖的 `vars` > 預設視圖的 `vars`。

## 區塊 (Sections)

`sections` 是一個命名空間，用於控制哪些區塊出現以及它們的順序。它包含兩個子欄位：

- **`hide`** 會將區塊從輸出中移除。預設情況下，所有未被隱藏的內容都會按照原始碼順序渲染。
- **`pin`** 會依照指定順序將區塊移至文件頂部。未被固定的區塊則接續在後，保持其原始碼順序。

兩個欄位都接受 [`data-section`](/guide/semantic-selectors#sections) 類型的值（例如 `work`、`skills`、`education`）。如果您使用常見的同義詞，例如 `experience`，Resumx 會建議使用標準名稱。

```yaml
sections:
  hide: [publications, volunteer]
  pin: [skills, work]
```

這將會隱藏 publications 和 volunteer 區塊，將 skills 釘選在第一位，work 第二位，然後其他所有內容按照原始碼順序排列。標頭（header）無論如何配置都永遠會被渲染。

一個區塊不能同時出現在 `hide` 和 `pin` 中。如果出現這種情況，Resumx 會拋出錯誤。

在 CLI 上，可以使用 `--hide` 和 `--pin` 參數（它們在內部映射到 `sections.hide` 和 `sections.pin`）：

```bash
resumx resume.md --hide publications --pin skills,work
```

## 項目符號順序 (Bullet Order)

`bullet-order` 控制每個區塊內的項目符號如何排列。

| 值     | 行為                                                                      |
| ------ | ------------------------------------------------------------------------- |
| `none` | 文件順序，與在 Markdown 中的寫法一致。**(預設)**                          |
| `tag`  | 被標記的項目符號會提升到頂部，並依照 `selects` 中宣告的順序在群組內排序。 |

假設有以下內容：

```markdown
- 帶領 5 人工程師團隊，提前 2 週交付專案
- 設計事件驅動微服務，處理每天 200 萬筆事件 {.@distributed-systems}
- 建立具有 OpenAPI 文件的 REST API {.@backend}
```

若設定 `bullet-order: tag` 以及 `selects: [backend, distributed-systems]`，被標記的項目符號會浮動到頂部，並按照 `selects` 的宣告順序（`backend` 在 `distributed-systems` 之前）排序：

```markdown
- 建立具有 OpenAPI 文件的 REST API {.@backend}
- 設計事件驅動微服務，處理每天 200 萬筆事件 {.@distributed-systems}
- 帶領 5 人工程師團隊，提前 2 週交付專案
```

如此一來，招募人員在 7.4 秒的掃視中會優先看到最相關的內容，而無需在原始檔案中重新排列任何東西。

## 臨時視圖 (Ephemeral Views)

CLI 參數如 `-v`、`--hide`、`--pin`、`--pages`、`--bullet-order` 和 `-s` 會在行內建立一個臨時視圖而不會將其持久化儲存。這對於快速迭代、撰寫腳本和 CI 流程非常有用：

```bash
resumx resume.md --for backend -v tagline="串流處理, Go" --pin skills,work -o stripe.pdf
```

在功能上這就是一個包含了 `selects: [backend]`、`vars.tagline`、`sections.pin` 和 `output` 的視圖，只是它不以檔案形式存在。

## 層疊順序 (Cascade Order)

視圖像 CSS 層疊一樣堆疊。每一層都可以覆寫下一層的特定欄位。在一層中未設定的欄位會穿透到下一層。

```
內建預設值
  → 預設視圖 (frontmatter 渲染欄位)
    → 標籤視圖 或 自訂視圖 (取決於 --for 解析為哪一個)
      → 臨時視圖 (CLI 參數)
```

標籤視圖和自訂視圖處於同一層級。`--for` 會準確地解析為其中之一，並且該視圖會覆寫預設視圖。如果名稱同時匹配到標籤視圖和自訂視圖，Resumx 會拋出錯誤。臨時視圖（CLI 參數）會覆寫所有內容。

### 欄位如何合併

並非所有欄位的合併方式都相同。規則取決於欄位的形狀：

| 欄位形狀             | 欄位                                        | 合併規則                              |
| -------------------- | ------------------------------------------- | ------------------------------------- |
| 純量 (Scalar)        | `pages`, `bullet-order`, `format`, `output` | 後面層級取代                          |
| 記錄 (Record)        | `vars`, `style`                             | 淺層合併 (後面的鍵覆寫，前面的鍵保留) |
| 命名空間 (Namespace) | `sections`                                  | 每個子欄位 (`hide`, `pin`) 獨立取代   |
| 陣列 (Array)         | `selects`, `css`                            | 後面層級取代 (不串接)                 |

例如，如果預設視圖設定了 `vars: { tagline: "全端工程師", keywords: "React" }` 而自訂視圖設定了 `vars: { tagline: "後端工程師" }`，解析後的結果會是 `{ tagline: "後端工程師", keywords: "React" }`。自訂視圖的 `tagline` 會覆寫，預設視圖的 `keywords` 會被保留。

對於 `sections`，每個子欄位會獨立替換。在子視圖中設定 `sections: { pin: [skills] }` 只會取代 `pin`，父級的 `hide` 會被保留。在子視圖中設定 `sections: { hide: [] }` 意味著「取消隱藏所有內容」，這不會影響 `pin`。

## 批次渲染

一次渲染所有視圖，或使用 glob 模式渲染子集：

```bash
resumx resume.md --for '*'
resumx resume.md --for 'stripe-*'
```

若要將預設視圖（無標籤過濾）與特定視圖一起包含，請使用 `--for default` 並列出具名視圖。`default` 名稱是保留的；請勿將其用於標籤或自訂視圖。範例：`resumx resume.md --for default,frontend` 會同時產生 `resume.pdf`（所有內容）和 `resume-frontend.pdf`（僅包含 frontend 過濾的內容）。

Glob 模式會與所有具名視圖（標籤視圖和自訂視圖）進行比對。模式必須至少匹配到一個視圖，否則 Resumx 會拋出一個列出可用名稱的錯誤。
