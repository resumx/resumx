![Resumx OG Image](/og-image.png)

---

客製化的履歷能獲得 [10 倍以上的面試機會](/playbook/tailored-vs-generic)，但大多數人會跳過這一步，因為這意味著需要管理多個檔案，並不斷重新排版以塞進一頁。Resumx 讓您在單一檔案中為每個職位量身打造履歷，並自動將內容調整為您設定的頁數。

- **沒有負擔的客製化：** 在同一個檔案中為不同的目標受眾標記內容（`{.@frontend}`、`{.@backend}`），每個內容都會自動適應您的頁面限制。
- **永遠完美適應頁面：** 設定 `pages: 1` 並自由新增或移除內容，Resumx 會縮放排版字體和間距，使其永遠完美落在一頁內。
- **對 AI 友善的預設設計：** 單一檔案的純 Markdown 格式，讓 AI 工具可以閱讀、編輯，並帶著完整上下文來協助客製化。
- **多寫內容，少做決策：** 合理的版面和結構預設值，讓您專注於內容實質。

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

<ResumeDemo />

[不到一分鐘即可開始使用 →](/guide/quick-start) 使用 [AI](/guide/using-ai) 進行編輯。從 [任何 commit](/guide/git-integration) 渲染。單一來源產生 [多語言](/guide/multi-language) 輸出。
