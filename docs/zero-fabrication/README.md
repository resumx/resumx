# Zero Fabrication Policy — Documentation

This directory contains prompt templates and workflow guides for enforcing the
Zero Fabrication Policy when using Claude (API, Claude.ai, or Claude Code) to
tailor resumes built with Resumx.

## Files

| File | Purpose |
|---|---|
| `TAILORING_PROMPT.md` | Drop-in system prompt for Claude API / Claude.ai tailoring |
| `AUDIT_PROMPT.md` | Drop-in prompt to audit tailored output for fabrications |
| `RESUME_TEMPLATE.md` | Annotated `resume.md` template with ZFP syntax pre-filled |

## Quick Start

1. Copy `RESUME_TEMPLATE.md` → rename to `resume.md` in your Resumx project
2. Fill in your real experience, tagging every quantified bullet with `<!-- verified -->`
3. Use `TAILORING_PROMPT.md` as your system prompt when calling Claude
4. After generation, run `AUDIT_PROMPT.md` to verify no fabrications slipped in
5. Build your PDFs with `resumx resume.md --for [target]`

If you use **Claude Code**, use the agents in `.claude/agents/` instead:
```
Tailor my resume for the [Company] file
Audit the tailored resume for [Company] against my master
```
