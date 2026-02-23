# Using AI

Resumx is designed to work with AI. Give your agent a job posting URL and your `resume.md`, and it handles tailoring, formatting, and verification.

## Agent Skills

Install [Agent Skills](https://agentskills.io/home) so your AI editor understands Resumx syntax, layout options, and conventions before it starts editing:

```bash
npx skills add ocmrz/resumx
```

### What's Included

- **writing-resume** - Interactive resume creation. Collects your info step-by-step and generates properly formatted Resumx markdown.
- **json-resume-to-markdown** - Converts between [JSON Resume](https://jsonresume.org/) and Resumx markdown in either direction.

## Tailor Your Resume

The fastest way to tailor a resume for a specific job:

1. Give the agent your `resume.md` and the job posting URL
2. The agent extracts must-have requirements and keywords
3. It maps each requirement to your existing bullets (covered, weak, or missing)
4. It proposes minimal edits -- rewords weak bullets, adds missing ones
5. Run `resumx resume.md` to validate and render to verify

::: info Why you don't need to worry about layout
With [`pages: 1`](/guide/fit-to-page), Resumx automatically adjusts spacing and font size after every edit. The agent can add, remove, or rewrite bullets freely, the content will always fill exactly one page.
:::

### Example Prompt

```
Read resume.md and fetch <URL>. Identify the must-have requirements
from the job description, map each to my existing bullets, then
propose targeted edits. Keep facts truthful.
```

Replace `<URL>` with the job posting link. Adjust the instructions to match your workflow. For example, ask the agent to focus on a specific role variant or preserve certain sections.
