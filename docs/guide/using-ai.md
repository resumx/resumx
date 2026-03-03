# Using AI

Resumx resumes are Markdown, so AI editors can read and modify them directly. Resumx adds its own syntax on top, so installing the agent skill below gives your AI the context it needs.

## Agent Skills

Install [Agent Skills](https://agentskills.io/home) so your AI editor understands Resumx syntax, layout options, and conventions before it starts editing:

```bash
npx skills add resumx/resumx
```

### What's Included

- **writing-resume** - Interactive resume creation. Collects your info step-by-step and generates properly formatted Resumx markdown.
- **json-resume-to-markdown** - Converts between [JSON Resume](https://jsonresume.org/) and Resumx markdown in either direction.

## What AI Can Do

With the skill installed, your AI editor can:

- **Write your resume from scratch.** Collect your experience, skills, and projects through conversation, then generate a complete `resume.md`.
- **Improve existing content.** Reword bullets for stronger impact, quantify achievements, and fix formatting.
- **Tailor for specific jobs.** Once you've learned about [tags](/guide/tags) and [views](/guide/views), the agent can create tailored variants of your resume for each application without duplicating content.

### Example Prompt

```
Read resume.md and help me improve my bullet points. Focus on
quantifying achievements and using stronger action verbs.
Keep everything truthful.
```

::: tip Going deeper
Once you're familiar with [tailoring](/guide/tailoring), check out [AI Workflows](/guide/ai-tailoring-workflows) to see how agents can automate the entire application process, from reading job descriptions to producing tailored PDFs.
:::
