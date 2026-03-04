# AI 定制工作流

一旦你熟悉了 [tags](/guide/tags) 和 [views](/guide/views)，AI 智能体就可以为你的每次求职申请处理完整的简历定制工作流。

## 定制你的简历

只需将你的 `resume.md` 和职位发布 URL 提供给智能体，它就会处理定制、格式化和检查。

### 智能体的工作流

1. **阅读（Read）** 职位描述（URL 或粘贴的文本）
2. **映射（Map）** 将每个要求与你现有的要点（bullet）进行匹配：已涵盖、较弱或缺失
3. **决策（Decide）** 确定哪些是持久的修改，哪些是临时修改（参见[编辑与查询](#edit-vs-query)）
4. **编辑（Edit）** 修改 resume.md 进行持久性改进（新的要点、更好的措辞、新的 tags）
5. **组合（Compose）** 创建一个 [view](/guide/views) 或使用 CLI 变量进行临时的、针对特定职位描述（JD）的调整（关键字、部分顺序）
6. **渲染（Render）** 并向你展示结果

```bash
resumx resume.md --for stripe-swe -o out/stripe.pdf
```

::: info 为什么你不需要担心排版
借助 [`pages: 1`](/guide/fit-to-page)，Resumx 会在每次编辑后自动调整间距和字体大小。智能体可以自由地添加、删除或重写要点，内容将始终精确填满一页。
:::

### 提示词示例

```
Read resume.md and fetch <URL>. Identify the must-have requirements
from the job description, map each to my existing bullets, then
propose targeted edits. For keyword alignment and section ordering,
create a view instead of rewriting bullets. Keep facts truthful.
```

将 `<URL>` 替换为职位发布链接。你可以调整指令以匹配你的工作流。

## 编辑与查询 (Edit vs Query)

并非所有修改都应该写入简历文件。智能体技能包含一个简单的启发式规则：**这个修改会让接下来的 10 次申请更好，还是仅仅只对这一次有用？**

| 场景                                                    | 行动            | 理由                         |
| ------------------------------------------------------- | --------------- | ---------------------------- |
| 你发布了一个新项目                                      | 编辑 resume.md  | 每次未来的申请都会受益       |
| JD 强调“流处理（stream processing）”                    | View vars / CLI | 只有这次申请关心             |
| 一个要点低估了其影响力                                  | 编辑 resume.md  | 更好的措辞在任何地方都有帮助 |
| 一个职位希望先展示技能再展示经验                        | View `pin`      | 其他职位希望保持原来的顺序   |
| 你学会了 Rust                                           | 编辑 resume.md  | 你的技能栈中永久添加了一项   |
| JD 上写的是 "CI/CD"，而你写的是 "deployment automation" | 视情况而定      | 两者都有可能                 |

持久的修改会丰富你的内容库，并在未来的每次申请中产生复利。临时的修改则存在于 [views](/guide/views) 或 CLI 标志中，不会让源文件变得杂乱。

::: tip 心智模型
你的 `resume.md` 是你的职业生涯，它随着你的职业生涯一起成长。每次申请都是它的一个不同视图（view）。智能体的默认模式是组合正确的视图（查询），而不是重写数据（编辑）。当改进是永久的，它进行编辑；当调整是视情况而定的，它进行查询。
:::

## 智能体工作流

### 零文件修改渲染

为了实现最快的速度且避免污染 git diff，智能体可以在不触碰任何文件的情况下进行渲染：

```bash
resumx resume.md --for backend -v tagline="Stream Processing, Go, Kafka" --pin skills,work -o stripe.pdf
```

所有输入都在命令中明确指定。没有保存任何内容，也不需要撤销。

### 使用 Views 批量申请

为每次申请创建 `.view.yaml` 文件：

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

当申请新工作时，智能体会创建新的 `.view.yaml` 文件。每个文件都是一个完整、可复现的渲染任务。Resumx 会自动发现所有 `*.view.yaml` 文件。

### 渐进式投入

智能体会根据你的使用情况，自然地从临时修改升级到持久修改：

1. **一次性申请：** 纯 CLI 标志。不保存任何内容。
2. **值得跟踪：** 智能体创建一个 view。可复现，受版本控制。
3. **常驻职位类型：** 智能体添加组合的 [tag](/guide/tags)，这样内容标签就可以在多个 views 中复用。
4. **永久性改进：** 智能体直接编辑 `resume.md`。使所有未来的渲染受益。
