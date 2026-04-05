# Zero Fabrication Policy for Resumx

> Ported and adapted from [ats-resume-agent](https://github.com/NullSpace-BitCradle/ats-resume-agent) by NullSpace-BitCradle.

## The Core Principle

**Your `resume.md` is an immutable database. Claude is the renderer, not the author.**

When Claude tailors your resume for a job description, it may only:
- **Select** bullets that are relevant to the role
- **Filter** content by Resumx tags (`{.@backend}`, `{.@ai}`, etc.)
- **Reorder** sections for emphasis
- **Mirror** job description keywords — but only map them to bullets that already exist

Claude may **never**:
- Estimate, approximate, or suggest metrics not present in `resume.md`
- Add skills, tools, or experiences not explicitly written in the source file
- Paraphrase in a way that inflates, generalizes, or embellishes a claim
- Ask you to "estimate conservatively" — if a number isn't there, it's omitted

This is a **hard constraint**, not a suggestion.

---

## Annotation Syntax

Annotate your `resume.md` bullets with these special comment markers. Claude agents
read and respect these as binding instructions.

### Verified Metrics Tag
Use `<!-- verified -->` to mark any bullet containing a quantified achievement
that you can back up with evidence. Claude may only use quantified claims from
bullets carrying this tag.

```markdown
- Reduced API latency by 40% via Redis caching layer {.@backend} <!-- verified -->
- Led team of 8 engineers across 3 time zones {.@backend}{.@leadership} <!-- verified -->
- Built streaming pipeline handling 10k concurrent connections {.@backend} <!-- verified -->
```

Bullets **without** `<!-- verified -->` will be included as-is — Claude will
not attempt to add, infer, or invent a metric for them.

### Agent Notes
Use `<!-- agent-note: YOUR INSTRUCTION -->` to embed binding directives for Claude.
These override any other instruction in the prompt.

```markdown
<!-- agent-note: Do not include this role in senior engineering applications -->
### Junior Dev — Startup XYZ (2015–2017)
```

```markdown
<!-- agent-note: Use this summary only for DevOps and infrastructure roles -->
> Cloud-native infrastructure engineer with 8 years...
```

### Skip Sections
Mark entire sections that Claude must never include in any tailored output:

```markdown
<!-- agent-note: SKIP THIS SECTION - legacy technologies, do not include -->
## Legacy Skills
- COBOL, Fortran, VBA, Classic ASP
```

### Verified-Only Mode
Add `<!-- verified-only -->` at the top of your `resume.md` to instruct Claude
that it may **only** include bullets tagged `<!-- verified -->` when writing
quantified impact statements.

```markdown
<!-- verified-only -->
# Your Name
...
```

---

## Claude Agent Files

This repo ships with two Claude agent definitions under `.claude/agents/`:

| Agent | Purpose |
|---|---|
| `resumx-tailor.md` | Tailors `resume.md` for a specific job description with ZFP enforced |
| `resumx-audit.md` | Audits a tailored output against the master `resume.md` for fabrications |

See `docs/zero-fabrication/` for prompt templates if you use Claude directly
(API, Claude.ai, etc.) rather than Claude Code.

---

## Workflow

```
1. Write your master resume.md once
   └─ Annotate every quantified bullet with <!-- verified -->
   └─ Add <!-- agent-note: SKIP --> to legacy/irrelevant sections
   └─ Optionally add <!-- verified-only --> at the top

2. Drop a job description file: Job_Description-Company-Role.md

3. Run the tailor agent (Claude Code):
   > Tailor my resume for the [Company] file

4. Agent outputs a tailored resume.md variant with only relevant,
   verified content — no fabricated metrics, no embellished claims

5. Build with Resumx:
   > resumx resume.md --for company-role

6. Optional audit pass:
   > Audit this tailored resume against my master resume.md
```

---

## Pre-Delivery Checklist

Before building a final PDF, verify:

- [ ] Every quantified metric in the output traces back to a `<!-- verified -->` bullet in `resume.md`
- [ ] No skills, tools, or technologies were added that don't exist in `resume.md`
- [ ] No `<!-- agent-note: SKIP -->` sections appear in the output
- [ ] No metric was paraphrased in a way that inflates the original number
- [ ] All inline `<!-- agent-note: -->` directives were respected
- [ ] Job description keywords were mapped only to existing content, not inserted freely
