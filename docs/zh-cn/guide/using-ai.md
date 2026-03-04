# 使用 AI (Using AI)

Resumx 的简历采用 Markdown 格式，因此 AI 编辑器可以直接读取并修改它们。由于 Resumx 在其之上添加了自己的语法，因此安装以下 Agent Skill 可以为你的 AI 提供所需的上下文。

## 代理技能 (Agent Skills)

安装 [Agent Skills](https://agentskills.io/home)，以便你的 AI 编辑器在开始编辑之前，能够理解 Resumx 语法、布局选项和相关约定：

```bash
npx skills add resumx/resumx
```

### 包含的内容

- **writing-resume** - 交互式简历创建。通过分步对话收集你的信息，并生成格式正确的 Resumx markdown。
- **json-resume-to-markdown** - 在 [JSON Resume](https://jsonresume.org/) 和 Resumx markdown 之间进行双向转换。

## AI 能做什么

安装技能后，你的 AI 编辑器可以：

- **从零开始写简历**：通过对话收集你的经验、技能和项目，然后生成一份完整的 `resume.md`。
- **改进现有内容**：重写列表项以增强其影响力，量化你的成就，并修复格式。
- **为特定职位定制**：一旦你了解了[标签 (tags)](/guide/tags)和[视图 (views)](/guide/views)，Agent 就可以为每次申请创建简历的定制化变体，且无需重复内容。

### 示例提示词 (Prompt)

```
阅读 resume.md 并帮我改进列表项（bullet points）。
重点关注如何量化成就和使用更有力的行为动词。
请保持所有内容的真实性。
```

::: tip 深入了解
一旦你熟悉了[定制化](/guide/tailoring)流程，请查看 [AI 工作流](/guide/ai-tailoring-workflows)，了解 Agents 如何自动化整个求职申请流程——从阅读职位描述到生成定制化的 PDF。
:::
