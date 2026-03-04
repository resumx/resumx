# AI 客製化工作流程 (AI Tailoring Workflows)

一旦你熟悉了[標籤 (tags)](/guide/tags) 和[視圖 (views)](/guide/views)，AI 代理就能為每個職位申請處理整個客製化工作流程。

## 客製化你的履歷

將你的 `resume.md` 和職位發布的 URL 提供給代理，它就會處理客製化、格式化及驗證等工作。

### 代理的工作流程

1. **閱讀 (Read)** 職位描述 (URL 或貼上的文字)
2. **對應 (Map)** 將每個要求對應到你現有的列點：已涵蓋、較弱或缺失
3. **決定 (Decide)** 什麼是持久性修改，什麼是臨時性調整 (請參閱[編輯 vs 查詢](#edit-vs-query))
4. **編輯 (Edit)** 修改 `resume.md` 進行持久性的改善 (新增列點、更好的措辭、新標籤)
5. **組合 (Compose)** 建立一個[視圖 (view)](/guide/views) 或透過 CLI 變數進行針對該 JD 的臨時性調整 (關鍵字、區塊順序)
6. **渲染 (Render)** 並向你展示結果

```bash
resumx resume.md --for stripe-swe -o out/stripe.pdf
```

::: info 為什麼你不需要擔心排版
設定 [`pages: 1`](/guide/fit-to-page) 後，Resumx 會在每次編輯後自動調整間距和字體大小。代理可以自由地新增、移除或重寫列點，內容始終會精確地填滿一頁。
:::

### 提示詞範例 (Example Prompt)

```
閱讀 resume.md 並抓取 <URL>。從職位描述中找出必備的要求，
將每個要求對應到我現有的列點，然後提出有針對性的修改建議。
對於關鍵字對齊和區塊排序，請建立一個視圖，而不是重寫列點。
請保持事實的真實性。
```

將 `<URL>` 替換為職位發布的連結。根據你的工作流程調整指示。

## 編輯 vs 查詢 (Edit vs Query)

並非所有的變更都應該寫入履歷檔案中。代理技能編碼了一個簡單的啟發式規則：**這項變更會讓接下來的 10 個申請更好，還是只對這一個有幫助？**

| 情況                                                     | 行動           | 原因                         |
| -------------------------------------------------------- | -------------- | ---------------------------- |
| 你完成了一個新專案                                       | 編輯 resume.md | 對未來每個申請都有幫助       |
| 一份 JD 強調「流處理 (stream processing)」               | 視圖變數 / CLI | 只有這個申請在意             |
| 某個列點低估了其影響力                                   | 編輯 resume.md | 更好的措辭對所有情況都有幫助 |
| 某個職位希望技能放在經驗之前                             | 視圖 `pin`     | 其他職位希望保持原始順序     |
| 你學會了 Rust                                            | 編輯 resume.md | 對你的技能組是永久的補充     |
| 一份 JD 寫了「CI/CD」而你寫的是「deployment automation」 | 視情況判斷     | 兩種做法都可以               |

持久性的變更會擴充你的內容庫，它們會在未來的每一次申請中產生複利效應。臨時性的變更則存在於[視圖 (views)](/guide/views) 或 CLI 標籤中，不會讓原始碼變得雜亂。

::: tip 概念模型
你的 `resume.md` 代表你的職涯，它會隨著你的職涯一起成長。每個申請都是對它的一種不同視角。代理的預設模式是組合出正確的視圖 (查詢)，而不是重寫資料 (編輯)。當改善是永久性的，它會進行編輯；當調整是根據具體情況時，它會進行查詢。
:::

## 代理化工作流程 (Agentic Workflows)

### 零檔案修改渲染

為了達到最快的速度和零 git diff 污染，代理可以在不觸碰任何檔案的情況下進行渲染：

```bash
resumx resume.md --for backend -v tagline="Stream Processing, Go, Kafka" --pin skills,work -o stripe.pdf
```

所有輸入都明確地包含在指令中。沒有儲存任何內容，也沒有需要復原的項目。

### 使用視圖進行批量申請

為每個申請建立 `.view.yaml` 檔案：

```yaml
# stripe-swe.view.yaml
stripe-swe:
  selects: [backend, distributed-systems]
  sections:
    pin: [skills, work]
  vars:
    tagline: 'Stream Processing, Event-Driven Architecture, Go, Kafka'
```

```yaml
# vercel-fe.view.yaml
vercel-fe:
  selects: [frontend, ui]
  vars:
    tagline: 'React, UI Performance, Design Systems, Next.js'
```

當你申請新工作時，代理會建立新的 `.view.yaml` 檔案。每個檔案都是一個完整、可重現的渲染任務。Resumx 會自動發現所有 `*.view.yaml` 檔案。

### 漸進式承諾 (Progressive Commitment)

代理會根據你的使用情況，自然地從臨時性調整升級為持久性變更：

1. **一次性申請：** 純 CLI 標籤。沒有儲存任何內容。
2. **值得追蹤：** 代理建立一個視圖。可重現且受版本控制。
3. **重複出現的職位類型：** 代理加入一個組合[標籤 (tag)](/guide/tags)，讓內容標籤可在多個視圖中重複使用。
4. **永久性改善：** 代理直接編輯 `resume.md`。使所有未來的渲染都受益。
