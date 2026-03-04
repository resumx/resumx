# 使用 AI

Resumx 履歷採用 Markdown 格式，因此 AI 編輯器可以直接讀取和修改它們。Resumx 在其上添加了專屬語法，因此安裝下方的 Agent Skill 能為你的 AI 提供所需的上下文。

## 代理技能 (Agent Skills)

安裝 [Agent Skills](https://agentskills.io/home) 讓你的 AI 編輯器在開始編輯前，能了解 Resumx 語法、排版選項及慣例：

```bash
npx skills add resumx/resumx
```

### 包含內容

- **writing-resume** - 互動式履歷建立。逐步收集你的資訊並生成格式正確的 Resumx markdown。
- **json-resume-to-markdown** - 在 [JSON Resume](https://jsonresume.org/) 與 Resumx markdown 之間進行雙向轉換。

## AI 可以做什麼

安裝此技能後，你的 AI 編輯器可以：

- **從頭撰寫你的履歷。** 透過對話收集你的經驗、技能和專案，然後生成完整的 `resume.md`。
- **改進現有內容。** 重新潤飾列點以增強影響力、量化成就，並修正格式。
- **為特定職位客製化。** 一旦你了解了[標籤 (tags)](/guide/tags) 和[視圖 (views)](/guide/views)，AI 代理就能為每個申請創建客製化的履歷變體，而無需複製內容。

### 提示詞範例 (Example Prompt)

```
閱讀 resume.md 並幫助我改進我的列點。專注於量化成就並使用更有力的動詞。
請保持所有內容的真實性。
```

::: tip 深入了解
一旦你熟悉了[客製化 (tailoring)](/guide/tailoring)，請查看 [AI 工作流程 (AI Workflows)](/guide/ai-tailoring-workflows)，了解代理如何自動化整個申請流程，從閱讀職位描述到生成客製化的 PDF。
:::
