# Claude Usage Guide — Zero Fabrication Policy

This guide covers every way to use Claude with your Resumx resume under the
Zero Fabrication Policy: Claude Code agents, direct API, and Claude.ai.

---

## The Golden Rule

Before anything else, understand the model:

```
resume.md  →  Claude (renderer)  →  tailored/Resume-Company-Role.md  →  resumx build  →  PDF
     ↑
  ONLY source of truth
  Claude never adds content here
```

**Claude's job:** select, filter, reorder, mirror keywords — never invent.

---

## Method 1 — Claude Code Agents (Recommended)

This is the most powerful and automated path. The ZFP constraints are baked
directly into the agent system prompts — you don't need to repeat them.

### Prerequisites

- Claude Code installed (`claude --version`)
- `.claude/agents/resumx-tailor.md` and `.claude/agents/resumx-audit.md`
  present in your resume project directory (see `SETUP.md` Step 6)

### Setup

```bash
cd ~/my-resume
claude   # starts Claude Code in your resume project
```

---

### Phase 1 — Annotate Your Master Resume

Before any tailoring, your `resume.md` must be properly annotated.
You only do this once.

**Open `resume.md` and:**

1. Add `<!-- verified-only -->` at the very top:
   ```markdown
   <!-- verified-only -->
   <!-- ZFP: All AI generation governed by Zero Fabrication Policy -->
   ```

2. Tag every bullet that contains a real, backed-up metric:
   ```markdown
   - Reduced API response time by 40% via Redis caching {.@backend} <!-- verified -->
   - Led team of 12 engineers across 3 countries {.@leadership} <!-- verified -->
   - Built CI/CD pipeline reducing deploy time from 45min to 8min {.@devops} <!-- verified -->
   ```

3. Mark sections Claude must always skip:
   ```markdown
   <!-- agent-note: SKIP THIS SECTION - legacy technologies -->
   ## Legacy Skills
   - COBOL, VBA, Classic ASP
   ```

4. Add per-role agent notes where needed:
   ```markdown
   <!-- agent-note: Do not include in senior engineering applications -->
   ### Junior Dev — Startup XYZ (2015–2017)
   ```

---

### Phase 2 — Create a Job Description File

For each job you're applying to, create a dedicated JD file:

```bash
touch Job_Description-Stripe-Backend.md
```

Paste the full job description into it:

```markdown
# Stripe — Backend Engineer, Infrastructure

## About the Role
We're looking for a backend engineer to join our infrastructure team...

## Requirements
- 5+ years backend experience
- Strong Python or Go skills
- Experience with distributed systems
- CI/CD pipeline experience
...
```

Naming convention: `Job_Description-[Company]-[Role].md`

---

### Phase 3 — Tailor with the ZFP Agent

In your Claude Code session:

```
Tailor my resume for the Stripe Backend file
```

The `resumx-tailor` agent will:
1. Read your `resume.md` and parse all annotations
2. Read `Job_Description-Stripe-Backend.md`
3. Build a keyword map (only mapping to content that actually exists)
4. Select the most relevant bullets and sections
5. Output `tailored/Resume-Stripe-Backend.md`
6. Print a **ZFP Traceability Report** showing every keyword mapping and confirming zero metrics were added

**Example traceability report output:**
```
## ZFP Traceability Report — Stripe Backend

| JD Keyword      | Mapped To          | Source Bullet                                |
|---|---|---|
| Python          | Skills > Languages | "Python, Node.js, TypeScript"                |
| CI/CD           | DevOps Experience  | "Built CI/CD pipeline..." <!-- verified -->  |
| Distributed sys | Cloud Arch role    | "Architected microservices..." <!-- verified --> |
| Kubernetes      | OMITTED            | no source in resume.md                       |

Fabrication check:
✅ Zero metrics added or estimated
✅ Zero skills inserted without source
✅ All agent-notes respected
✅ All SKIP sections excluded
```

If a JD keyword appears as **OMITTED**, that's the policy working correctly —
the skill wasn't in your resume so it wasn't inserted.

---

### Phase 4 — Audit the Output

After tailoring, run the audit agent to verify nothing slipped through:

```
Audit the tailored resume for Stripe against my master
```

The `resumx-audit` agent reads both files forensically and outputs:

```
## ZFP Audit Report — tailored/Resume-Stripe-Backend.md
Result: PASS

🔴 Violations: none
🟡 Warnings: none
✅ All quantified bullets trace back to <!-- verified --> source

Recommendation: APPROVE — safe to build PDF
```

If you get a **FAIL**, the agent will show exactly which line was inflated or
fabricated, so you can fix it before building.

---

### Phase 5 — Build the PDF

Once the audit passes:

```bash
resumx tailored/Resume-Stripe-Backend.md
# or pass a specific --for target if you used tags:
resumx resume.md --for stripe-backend
```

Your PDF lands in `output/`.

---

### Iteration Loop

Common follow-up commands in Claude Code after initial generation:

```
# Adjust tone or emphasis
Make the summary more focused on distributed systems leadership

# Add a specific bullet you forgot
Add the Kafka migration project from my master resume to the Stripe variant

# Fix an audit violation
The audit flagged line 42 — fix it to match the exact metric in resume.md

# Generate cover letter (ZFP also applies)
Generate a cover letter for the Stripe role using only content from resume.md

# Re-audit after changes
Re-audit the updated tailored resume for Stripe
```

---

## Method 2 — Claude API (Python / Node.js)

Use this when you want to integrate ZFP tailoring into a script or pipeline.

### Python Example

```python
import anthropic

client = anthropic.Anthropic(api_key="sk-ant-...")

# Load files
with open("resume.md") as f:
    master_resume = f.read()

with open("Job_Description-Stripe-Backend.md") as f:
    job_description = f.read()

# Load the ZFP system prompt
with open("docs/zero-fabrication/TAILORING_PROMPT.md") as f:
    # Extract the prompt block between the triple backticks
    raw = f.read()
    system_prompt = raw.split("```")[1].strip()  # pulls the system prompt block

# Run tailoring
response = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=4096,
    system=system_prompt,
    messages=[
        {
            "role": "user",
            "content": f"""Here is my master resume.md:

{master_resume}

Here is the job description:

{job_description}

Please tailor my resume for this role following the Zero Fabrication Policy."""
        }
    ]
)

tailored = response.content[0].text

# Save output
with open("tailored/Resume-Stripe-Backend.md", "w") as f:
    f.write(tailored)

print("Tailored resume saved to tailored/Resume-Stripe-Backend.md")
```

### Node.js / TypeScript Example

```typescript
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const masterResume = fs.readFileSync("resume.md", "utf-8");
const jobDescription = fs.readFileSync(
  "Job_Description-Stripe-Backend.md",
  "utf-8"
);

// Load ZFP system prompt from the prompt template file
const templateRaw = fs.readFileSync(
  "docs/zero-fabrication/TAILORING_PROMPT.md",
  "utf-8"
);
const systemPrompt = templateRaw.split("```")[1].trim();

const response = await client.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 4096,
  system: systemPrompt,
  messages: [
    {
      role: "user",
      content: `Here is my master resume.md:\n\n${masterResume}\n\nHere is the job description:\n\n${jobDescription}\n\nTailor my resume following the Zero Fabrication Policy.`,
    },
  ],
});

const tailored = (response.content[0] as { text: string }).text;
fs.writeFileSync("tailored/Resume-Stripe-Backend.md", tailored);
console.log("Done.");
```

### Batch Script (multiple JDs at once)

```bash
#!/bin/bash
# batch-tailor.sh — tailor all Job_Description-*.md files at once

for jd_file in Job_Description-*.md; do
  company_role=$(echo "$jd_file" | sed 's/Job_Description-//;s/.md//')
  echo "→ Tailoring for $company_role..."
  python3 tailor.py --jd "$jd_file" --output "tailored/Resume-${company_role}.md"
  echo "  Building PDF..."
  resumx "tailored/Resume-${company_role}.md"
  echo "  ✅ output/Resume-${company_role}.pdf"
done
```

---

## Method 3 — Claude.ai (Browser)

No API key required. Use this with the prompt templates in this repo.

### Step-by-Step

1. Open [claude.ai](https://claude.ai) and start a new conversation

2. **Set the system prompt** (use Projects feature or paste at the start):
   - Open `docs/zero-fabrication/TAILORING_PROMPT.md`
   - Copy the entire block between the triple backticks
   - Paste it as the first message with "System:" prefix, or use Claude Projects
     to set it as a Project instruction

3. **Send your tailoring request:**
   ```
   Here is my master resume.md:

   [paste the full contents of your resume.md]

   Here is the job description:

   [paste the full job description]

   Please tailor my resume for this role.
   ```

4. **Receive the tailored output** — Claude will return the tailored `resume.md`
   variant and a ZFP Traceability Report table

5. **Run the audit** in the same conversation (or a new one):
   - Open `docs/zero-fabrication/AUDIT_PROMPT.md`
   - Copy the audit prompt block
   - Send:
   ```
   [paste audit prompt]

   Here is my master resume.md:
   [paste]

   Here is the tailored resume to audit:
   [paste Claude's output from step 4]
   ```

6. Save Claude's tailored output to `tailored/Resume-Company-Role.md`

7. Build:
   ```bash
   resumx tailored/Resume-Company-Role.md
   ```

---

## ZFP Annotation Quick Reference

| Annotation | Where | Effect |
|---|---|---|
| `<!-- verified-only -->` | Top of `resume.md` | Strict mode: only `<!-- verified -->` bullets may carry quantified claims |
| `<!-- verified -->` | End of a bullet line | Marks this bullet's metrics as backed-up and safe to use |
| `<!-- agent-note: SKIP THIS SECTION -->` | Before a section heading | Claude skips entire section in all outputs |
| `<!-- agent-note: Do not include in X roles -->` | Before a role block | Claude skips this role when generating X-type applications |
| `<!-- agent-note: Use this summary only for Y roles -->` | Before a summary | Claude only uses this text for Y-type applications |
| `{.@backend}` `{.@ai}` etc. | End of a bullet | Resumx target tag — Claude uses these to select relevant content |

---

## Full End-to-End Example

```bash
# 1. Start in your resume project
cd ~/my-resume

# 2. Drop the JD
echo "[paste JD content]" > Job_Description-Anthropic-ML.md

# 3. Open Claude Code
claude

# 4. Tailor
> Tailor my resume for the Anthropic ML file

# 5. Audit
> Audit the tailored resume for Anthropic against my master

# 6. If audit passes, build
> exit
resumx tailored/Resume-Anthropic-ML.md

# 7. Open the PDF
open output/Resume-Anthropic-ML.pdf   # macOS
# or:
xdg-open output/Resume-Anthropic-ML.pdf  # Linux
```

Total time from JD to PDF: **under 3 minutes**.
Every claim in the output: **directly traceable to your resume.md**.

---

## Tips for Best Results

- **More `<!-- verified -->` tags = stronger output.** The more you annotate, the more Claude has to work with.
- **Be specific in agent notes.** `<!-- agent-note: Only include this in roles with >50% ML focus -->` is more useful than a vague note.
- **Keep JD files clean.** Paste the raw job description without your personal notes — Claude reads everything in the file.
- **Don't over-tag.** You don't need `{.@backend}` on every bullet. Tag intentionally so filtering produces focused variants.
- **Version control your master.** Run `git commit resume.md` after every update. If a tailored version ever looks wrong, you can diff against any previous state.
- **Run the audit before every PDF build.** It takes 30 seconds and can catch subtle fabrications introduced by iterative edits.
