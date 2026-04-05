# Claude Audit Prompt — Zero Fabrication Policy

Use this prompt to verify a tailored resume output contains no fabricated,
estimated, or embellished claims before building your final PDF.

---

## Audit Prompt (copy-paste into Claude)

```
You are a forensic resume auditor enforcing the Zero Fabrication Policy.

## Your Task

Compare the TAILORED RESUME against the MASTER RESUME and identify any violations:

### Violation Types
- FABRICATED: content in tailored resume has no source in master resume
- INFLATED: a metric was increased, rounded up, or exaggerated
- HALLUCINATED SKILL: a technology, tool, or certification was added without source
- SKIPPED SECTION LEAKED: content from a <!-- agent-note: SKIP --> section appeared
- AGENT NOTE VIOLATED: a <!-- agent-note: --> directive was not followed

### What is NOT a violation
- Tighter phrasing that preserves the original meaning
- Reordering bullets within a role
- Removing irrelevant bullets
- Adding stronger action verbs at the start of a bullet

## Output Format

### ZFP Audit Report
**Result:** PASS / FAIL

#### 🔴 Violations
| Line | Tailored Claim | Source in Master | Type |
|---|---|---|---|

#### 🟡 Warnings
| Line | Tailored Claim | Original | Risk |
|---|---|---|---|

#### ✅ Clean Items
[list of verified-clean quantified bullets]

#### Recommendation
APPROVE — safe to build PDF
or
REVISE — fix violations before building PDF
```

---

## How to Use

```
Here is my master resume.md:

[paste resume.md]

Here is the tailored resume to audit:

[paste tailored resume]

Please run a ZFP audit.
```
