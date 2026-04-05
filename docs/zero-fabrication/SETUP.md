# Local Setup Tutorial

This guide walks you through setting up Resumx with the Zero Fabrication Policy
layer from scratch on Linux, macOS, or WSL.

---

## Prerequisites Overview

| Tool | Required | Purpose |
|---|---|---|
| Node.js ≥ 18 | ✅ | Resumx CLI runtime |
| pnpm | ✅ | Package manager used by Resumx |
| Playwright Chromium | ✅ | PDF rendering engine |
| Git | ✅ | Version control for your resume |
| Claude Code CLI | Optional | AI tailoring with ZFP agents |
| Anthropic API key | Optional | Claude Code or direct API access |

---

## Step 1 — Clone Your Fork

This repo is already forked at `MarvenAPPS/resumx`. Clone it locally:

```bash
git clone https://github.com/MarvenAPPS/resumx.git
cd resumx
```

Switch to the Zero Fabrication branch:

```bash
git checkout feat/zero-fabrication-policy
```

Verify you can see the ZFP files:

```bash
ls ZERO_FABRICATION.md docs/zero-fabrication/ .claude/agents/
```

---

## Step 2 — Install Node.js

### Linux / WSL (recommended: nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc   # or ~/.zshrc
nvm install --lts
nvm use --lts
node --version     # should print v20.x or higher
```

### macOS

```bash
brew install node
node --version
```

### Verify

```bash
node --version   # ≥ 18.0.0 required
npm --version
```

---

## Step 3 — Install pnpm

Resumax uses pnpm workspaces internally. You need it to develop locally.

```bash
npm install -g pnpm
pnpm --version   # should print 8.x or 9.x
```

---

## Step 4 — Install Resumx CLI

### Option A — Global install (recommended for end users)

```bash
npm install -g @resumx/resumx
resumx --version
```

Install the Playwright Chromium browser (required for PDF rendering):

```bash
npx playwright install chromium
```

> **WSL note:** If you hit a missing system library error, install dependencies:
> ```bash
> npx playwright install-deps chromium
> ```

### Option B — Local dev install (if you want to modify Resumx source)

```bash
# from the repo root
pnpm install
pnpm run build
```

Then use the local binary:

```bash
node ./bin/resumx.js --version
# or add a local alias:
alias resumx="node $(pwd)/bin/resumx.js"
```

---

## Step 5 — Initialize Your Resume

Create your resume project directory. **Keep it separate from the Resumx repo.**

```bash
mkdir ~/my-resume
cd ~/my-resume
git init
```

Copy the Zero Fabrication annotated template as your starting point:

```bash
cp /path/to/resumx/docs/zero-fabrication/RESUME_TEMPLATE.md resume.md
```

Or generate a blank template with the CLI:

```bash
resumx init resume.md
```

Start the live preview:

```bash
resumx resume.md --watch
# opens a browser tab with live-reloading preview
```

Edit `resume.md` with your real experience. As you save, the preview updates instantly.

---

## Step 6 — Add Claude Code Skills (Optional)

Resumax ships a skills package that teaches Claude Code how to work with your resume.

```bash
# from your resume project directory
npx skills add resumx/skills
```

This installs the Resumx-aware skill context into Claude Code so it understands
tags, frontmatter, targets, and the build workflow.

The ZFP agents (`.claude/agents/resumx-tailor.md` and `.claude/agents/resumx-audit.md`)
should live in your **resume project directory**, not in the Resumx CLI repo.
Copy them:

```bash
mkdir -p .claude/agents
cp /path/to/resumx/.claude/agents/resumx-tailor.md .claude/agents/
cp /path/to/resumx/.claude/agents/resumx-audit.md .claude/agents/
```

---

## Step 7 — Install Claude Code (Optional)

Claude Code is Anthropic's CLI that runs the ZFP agents defined in `.claude/agents/`.

```bash
curl -fsSL https://install.anthropic.com | sh
claude --version
```

Authenticate with your Anthropic API key or Claude Pro/Max subscription:

```bash
claude auth login
```

Test it:

```bash
claude "What files are in this directory?"
```

> **API key setup (alternative):**
> ```bash
> export ANTHROPIC_API_KEY="sk-ant-..."
> # add to ~/.bashrc or ~/.zshrc to persist
> ```

---

## Step 8 — Build Your First Resume

From your resume project directory:

```bash
# Live preview
resumx resume.md --watch

# Build PDF
resumx resume.md

# Build a tailored variant for a specific target
resumx resume.md --for stripe-backend

# Build multiple targets at once
resumx resume.md --for stripe-backend,vercel-swe,startup-cto
```

Output files land in `output/` by default.

---

## Step 9 — Directory Structure

Your resume project should look like this when fully set up:

```
my-resume/
├── resume.md                          # Your master resume (MCD)
├── Job_Description-Stripe-Backend.md  # Job description files
├── Job_Description-Vercel-SWE.md
├── tailored/                          # ZFP-tailored variants (Claude output)
│   ├── Resume-Stripe-Backend.md
│   └── Resume-Vercel-SWE.md
├── output/                            # Built PDFs and HTML
│   ├── Resume-Stripe-Backend.pdf
│   └── Resume-Vercel-SWE.pdf
└── .claude/
    └── agents/
        ├── resumx-tailor.md           # ZFP tailor agent
        └── resumx-audit.md            # ZFP audit agent
```

`resume.md` and `Job_Description-*.md` files are gitignored in the `.gitignore`
by default in this fork to prevent accidental personal data commits.

Add them explicitly only if you intend to commit:

```bash
git add -f resume.md
```

---

## Troubleshooting

### Playwright browser not found

```bash
npx playwright install chromium
# If on WSL or Debian-based Linux:
npx playwright install-deps chromium
```

### `resumx: command not found`

```bash
npm install -g @resumx/resumx
# or check your PATH:
export PATH="$PATH:$(npm root -g)/../bin"
```

### PDF is blank or missing fonts

Playwright Chromium handles fonts automatically. If fonts are missing on a headless
Linux server:

```bash
sudo apt-get install -y fonts-liberation fonts-noto
```

### Claude Code auth fails

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
claude auth login
```

If you use Claude Pro/Max (browser subscription), authenticate via OAuth:

```bash
claude auth login --oauth
```
