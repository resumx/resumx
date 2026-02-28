# Using AI

Resumx is built for AI collaboration. Markdown is the format every LLM already thinks in, so an agent can read, edit, and tailor your resume with full context, no proprietary schema, no GUI state, no import/export loops.

## Agent Skills

Install [Agent Skills](https://agentskills.io/home) so your AI editor understands Resumx syntax, layout options, and conventions before it starts editing:

```bash
npx skills add resumx/resumx
```

### What's Included

- **writing-resume** - Interactive resume creation. Collects your info step-by-step and generates properly formatted Resumx markdown.
- **json-resume-to-markdown** - Converts between [JSON Resume](https://jsonresume.org/) and Resumx markdown in either direction.

## Tailor Your Resume

Give the agent your `resume.md` and a job posting URL, and it handles tailoring, formatting, and verification.

### The Agent's Workflow

1. **Read** the job description (URL or pasted text)
2. **Map** each requirement to your existing bullets: covered, weak, or missing
3. **Decide** what's durable vs ephemeral (see [edit vs query](#edit-vs-query))
4. **Edit** resume.md for durable improvements (new bullets, better phrasing, new tags)
5. **Compose** a [view](/guide/views) or CLI vars for ephemeral, per-JD adjustments (keywords, layout)
6. **Render** and show you the result

```bash
resumx resume.md --for stripe-swe -o out/stripe.pdf
```

::: info Why you don't need to worry about layout
With [`pages: 1`](/guide/fit-to-page), Resumx automatically adjusts spacing and font size after every edit. The agent can add, remove, or rewrite bullets freely, the content will always fill exactly one page.
:::

### Example Prompt

```
Read resume.md and fetch <URL>. Identify the must-have requirements
from the job description, map each to my existing bullets, then
propose targeted edits. For keyword alignment and section ordering,
create a view instead of rewriting bullets. Keep facts truthful.
```

Replace `<URL>` with the job posting link. Adjust the instructions to match your workflow.

## Edit vs Query

Not every change belongs in the resume file. The agent skill encodes a simple heuristic: **will this change make the next 10 applications better, or just this one?**

| Situation                                               | Action          | Why                                 |
| ------------------------------------------------------- | --------------- | ----------------------------------- |
| You shipped a new project                               | Edit resume.md  | Every future application benefits   |
| A JD emphasizes "stream processing"                     | View vars / CLI | Only this application cares         |
| A bullet undersells its impact                          | Edit resume.md  | Better phrasing helps everywhere    |
| A role wants skills before experience                   | View layout     | Other roles want the original order |
| You learned Rust                                        | Edit resume.md  | Permanent addition to your skillset |
| A JD says "CI/CD" and you wrote "deployment automation" | Judgment call   | Could go either way                 |

Durable changes grow your content library, they compound across every future application. Ephemeral changes live in [views](/guide/views) or CLI flags and don't clutter the source.

::: tip The mental model
Your `resume.md` is your career, and it grows as your career does. Each application is a different view on it. The agent's default mode is composing the right view (query), not rewriting the data (edit). It edits when the improvement is permanent, it queries when the adjustment is situational.
:::

## Advanced: Agentic Workflows

### Zero-File-Modification Rendering

For maximum speed and zero git diff pollution, the agent can render without touching any file:

```bash
resumx resume.md --for backend -v tagline="Stream Processing, Go, Kafka" --layout experience,skills,projects -o stripe.pdf
```

All inputs are explicit in the command. Nothing saved, nothing to undo.

### Batch Applications with Views

Create `.view.yaml` files for each application:

```yaml
# stripe-swe.view.yaml
stripe-swe:
  selects: [backend, distributed-systems]
  layout: [experience, skills, projects]
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

The agent creates new `.view.yaml` files as you apply to new jobs. Each file is a complete, reproducible render job. Resumx discovers all `*.view.yaml` files automatically.

### Progressive Commitment

The agent naturally escalates from ephemeral to persistent based on your usage:

1. **One-off application:** Pure CLI flags. Nothing saved.
2. **Worth tracking:** Agent creates a view. Reproducible, version-controlled.
3. **Recurring role type:** Agent adds a composed [tag](/guide/tags) so content labels are reusable across multiple views.
4. **Permanent improvement:** Agent edits `resume.md` directly. Benefits all future renders.
