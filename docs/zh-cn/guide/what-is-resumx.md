![Resumx OG Image](/og-image.png)

---

按需定制的简历能获得 [10倍的面试机会](/playbook/tailored-vs-generic)，但大多数人通常都会跳过这一步，因为这不仅意味着管理多个文件，而且还要不断重新将所有的内容调整适应到一页纸中。Resumx 允许你只在一个文件中为每一个职位定制简历内容，并且它会自动将你的内容适配到你设定的页数中。

- **没有负担的按需定制：** 在一个文件里为不同受众打上标签（`{.@frontend}`、`{.@backend}`），每一份都会自动适应你的页面限制。
- **永远合适一页纸：** 设置 `pages: 1` 之后自由地添加或删除内容，Resumx 会自动缩放排版和间距以使其精确地刚好占满一页纸。
- **天生对 AI 友好：** 在单个文件中使用纯文本 Markdown，让 AI 工具能以完整的上下文阅读、编辑和定制你的简历。
- **多关注写作，少纠结决策：** 我们为排版和结构提供了合理的默认值，使你可以专注于实质性的内容。

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

[不出一分钟即可上手 →](/guide/quick-start) 与 [AI](/guide/using-ai) 一起编辑。从[任意的 commit](/guide/git-integration) 都可以渲染。同一个来源可提供[多语言支持](/guide/multi-language)。
