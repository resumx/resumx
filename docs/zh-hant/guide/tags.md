# 標籤 (Tags)

標籤是內容的篩選器。它們能控制履歷中的哪些部分要顯示給哪個受眾，而不會改變任何渲染方式。[視圖 (Views)](/guide/views) 負責處理渲染。請參閱 [客製化如何運作 (How Tailoring Works)](/guide/tailoring) 以了解其概念模型。

## 標記內容

在任何元素加上 `{.@name}`，將其標記給特定的受眾。未標記的內容始終會通過篩選。標記的內容只會在渲染相符的標籤時出現。

```markdown
- Built distributed systems serving 1M requests/day
- Built interactive dashboards with React and D3.js {.@frontend}
- Designed REST APIs with OpenAPI documentation {.@backend}
- Led team of 5 engineers to deliver project 2 weeks early
```

::: code-group

```markdown [frontend]
- Built distributed systems serving 1M requests/day
- Built interactive dashboards with React and D3.js
- Led team of 5 engineers to deliver project 2 weeks early
```

```markdown [backend]
- Built distributed systems serving 1M requests/day
- Designed REST APIs with OpenAPI documentation
- Led team of 5 engineers to deliver project 2 weeks early
```

:::

使用多個類別，可將一個元素包含在多個標籤中：

```markdown
- Implemented GraphQL API layer with TypeScript {.@backend .@frontend}
```

你也可以透過[括號區塊 (bracketed spans)](/guide/classes-and-ids#bracketed-spans) 標記行內文字，或是用[圍欄區塊 (fenced divs)](/guide/classes-and-ids#fenced-divs) 包裝整個段落。

<!-- 每個標籤皆可透過 `--for` 渲染： -->

<!--
每個標籤隱含了[標籤視圖 (tag view)](#tag-views)，所以即使沒有 `.view.yaml` 檔案，`--for frontend` 也總是能運作。輸出檔案會包含視圖名稱：`resume-frontend.pdf`、`resume-backend.pdf`。若需針對每個申請進行渲染設定（排版、變數、樣式），請建立[自訂視圖 (custom view)](/guide/views#custom-views)。

```bash
resumx resume.md --for frontend
resumx resume.md --for backend
``` -->

## 組合 (Composition)

假設你需要一個 `fullstack` 篩選器，它要同時包含 `{.@frontend}` 和 `{.@backend}` 內容。你可以在所有這些項目加上 `{.@fullstack}`，但這非常繁瑣。取而代之的是，在 frontmatter 中組合標籤。組合後的標籤會擴展其篩選範圍以涵蓋其組成項目：

```yaml
---
tags:
  fullstack: [frontend, backend]
---
```

現在 `fullstack` 包含了所有 `{.@frontend}` 內容、所有 `{.@backend}` 內容，以及明確標記為 `{.@fullstack}` 的內容，連同未標記的共同內容。

組合標籤可以參照其他組合標籤：

```yaml
---
tags:
  fullstack: [frontend, backend]
  tech-lead: [backend, leadership]
  startup-cto: [fullstack, leadership, architecture]
---
```

`startup-cto` 會<span class="hint" data-hint="包含子標籤的子標籤，而不僅僅是直接的子標籤">遞迴 (transitively)</span>展開：`fullstack` 解析為 `frontend` + `backend`，所以最終集合為 `{startup-cto, fullstack, frontend, backend, leadership, architecture}`。

群組中的每個標籤都必須作為內容標籤 (`{.@name}`) 或另一個組合標籤存在於履歷中 — 如果不存在，Resumx 會拋出錯誤並提供可能的拼寫建議。順序會被保留，並在設定時控制列表項目的排序。會檢測並針對循環參照（例如 `a: [b]` 與 `b: [a]`）拋出錯誤。

::: info 僅限聯集 (Union only)，無交集 (no intersection)
標籤和組合僅使用聯集邏輯。如果你需要交集，請建立更具體的標籤，例如 `{.@senior-frontend}`，而不是嘗試對 `@senior` 和 `@frontend` 取交集。
:::

標籤也可以帶有各自的渲染設定 (排版、頁數、樣式)。請參閱[標籤視圖 (Tag Views)](/guide/views#tag-views)。

## 階層式標籤 (Hierarchical Tags)

當一個領域橫跨多個生態系統時，扁平化標籤會迫使你做出選擇：標記得廣泛 (`@backend`) 卻失去區分技術棧的能力，或者標記得狹窄 (`@node`、`@jvm`) 卻失去了共用的父層上下文。階層式標籤透過直接編碼這些關係來解決這個問題。

### 語法

使用 `/` 將子標籤嵌套在其父標籤下：

```markdown
- Designed REST APIs with OpenAPI documentation {.@backend}
- Built microservices with `Express` and `Bull` queues {.@backend/node}
- Migrated `Spring Boot` monolith to modular architecture {.@backend/jvm}
```

深度不受限制：`{.@data/ml/nlp}` 是有效的，並且嵌套了三層。

### 繼承 (Inheritance)

只有一個規則：**包含你的整個世系（祖先 + 自身 + 後代）以及未標記內容。兄弟節點及其子樹會被排除。**

| 渲染                 | 包含                                                               | 排除                                |
| -------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| `--for backend/node` | `@backend` + `@backend/node` + 未標記內容                          | `@backend/jvm`、`@frontend` 等等    |
| `--for backend`      | `@backend` + `@backend/node` + `@backend/jvm` + 未標記內容         | `@frontend`、`@leadership` 等等     |
| `--for data/ml`      | `@data` + `@data/ml` + `@data/ml/nlp` + `@data/ml/cv` + 未標記內容 | `@data/analytics`、`@frontend` 等等 |

子視圖 (`--for backend/node`) 會繼承其祖先的通用內容 (`@backend`)，因此標記為 `@backend` 的 "Designed REST APIs" 項目會同時出現在 `backend/node` 與 `backend/jvm` 視圖中。父視圖 (`--for backend`) 包含了其所有的後代，提供了該領域的完整視角。

點擊下方任一節點，查看會包含哪些標籤：

<TagLineage />

### 階層式標籤的組合

階層式標籤支援[組合 (composition)](#composition)。世系會根據每個組成項目展開：

```yaml
---
tags:
  stripe: [frontend, backend/node]
---
```

`stripe` 會展開為：`@frontend`（+ 任何 `@frontend/*` 後代）+ `@backend`（`backend/node` 的祖先）+ `@backend/node` + 未標記內容。同層的 `@backend/jvm` 會被排除，因為只列出了 `backend/node`，而不是 `backend`。

### 何時使用階層

當一個領域確實分裂成無法互換的生態系統，並且你同時需要廣泛與狹窄的視角時，請使用階層。一些指南：

- **好的：** `backend/node`、`backend/jvm` (不同的技術棧，共用的父層上下文)
- **好的：** `data/ml/nlp`、`data/ml/cv` (機器學習中的次專業)
- **不必要：** `frontend/css` (CSS 很少作為獨立的招聘篩選條件)
- **錯誤：** `backend/api` (API 屬於所有後端工作的一部分，而不是一個獨立的生態系統)

如果你不會為它建立獨立的履歷變體，那麼它可能不需要擁有自己的標籤層級。
