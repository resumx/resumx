# Tagging a Resume

A semi-autonomous workflow for systematically tagging resume content so that the view system produces tailored, non-leaking output for each audience.

## When to Use

Use this resource when:

- A user asks to "tag my resume," "set up tags," or "make my resume tailorable"
- You're creating views or compositions and the resume has no tags yet
- Content is leaking between views (a backend bullet appears in frontend output)

## Overview

Tagging answers one question: **would a recruiter scanning for role X find this bullet relevant?** If yes for every role, don't tag. If only for specific audiences, tag it.

Three phases:

1. **Content Analysis** (autonomous): Classify every bullet
2. **Taxonomy Proposal** (validate with user): Present the tag plan
3. **Application** (autonomous after approval): Apply tags and composition

## Phase 1: Content Analysis

Read the resume and classify each bullet into one of three categories:

| Category            | Definition                                           | Example                                                                      |
| ------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Universal**       | Relevant to any hiring manager. Keep untagged.       | "Led team of 5 engineers to deliver project 2 weeks early"                   |
| **Domain-specific** | Only relevant to one audience. Tag it.               | "Built interactive dashboards with `React` and `D3.js`" → `{.@frontend}`     |
| **Multi-domain**    | Relevant to 2+ audiences but not all. Multiple tags. | "Implemented GraphQL API layer with `TypeScript`" → `{.@backend .@frontend}` |

### The Recruiter Filter Test

For each bullet, ask: "If I remove this bullet, would a recruiter for role X notice something missing?" If the answer is yes for ALL target roles, it's universal. If yes for only some, it's domain-specific to those roles.

### What NOT to Tag

| Don't tag                     | Why                                                                     | Instead                                                                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry headers (`### Company`) | Headers anchor context. Removing them orphans bullets.                  | Tag individual bullets under the entry.                                                                                                                                                                        |
| Section headers (`## Skills`) | Sections are managed by `sections.hide/pin`.                            | Use view config to control sections.                                                                                                                                                                           |
| Individual technologies       | `@react` or `@typescript` are too granular to be useful hiring filters. | Use domain tags like `@frontend`. Technologies appear in the bullet text naturally. If a domain splits into non-interchangeable ecosystems (e.g. `node` vs `jvm`), use hierarchical tags like `@backend/node`. |
| Soft skills bullets           | "Mentored 3 junior devs" is relevant to every role.                     | Leave untagged.                                                                                                                                                                                                |

### When to Use Hierarchy

Use hierarchical tags when a domain genuinely splits into non-interchangeable ecosystems and the user needs both a broad view and narrow views.

**Good candidates for hierarchy:**

| Parent    | Children                      | Rationale                                                     |
| --------- | ----------------------------- | ------------------------------------------------------------- |
| `backend` | `backend/node`, `backend/jvm` | Different runtime ecosystems with shared backend fundamentals |
| `data`    | `data/ml`, `data/analytics`   | Different specializations within data                         |
| `data/ml` | `data/ml/nlp`, `data/ml/cv`   | Sub-specialties within ML                                     |

**Bad candidates for hierarchy:**

| Proposed           | Why it's wrong                                              |
| ------------------ | ----------------------------------------------------------- |
| `backend/api`      | APIs are part of all backend work, not a separate ecosystem |
| `frontend/css`     | CSS is rarely a standalone hiring filter                    |
| `backend/database` | Database work is common across all backend stacks           |

**Rule of thumb:** if you wouldn't create a separate resume variant for it, it doesn't need its own tag level.

### Hierarchy Semantics

Hierarchical tags use `/` as a separator: `{.@backend/node}`.

Inheritance rule: **a view includes its entire lineage (ancestors + self + descendants) and untagged content. Siblings and their subtrees are excluded.**

| View                 | Includes                                                 | Excludes       |
| -------------------- | -------------------------------------------------------- | -------------- |
| `--for backend/node` | `@backend` + `@backend/node` + untagged                  | `@backend/jvm` |
| `--for backend`      | `@backend` + `@backend/node` + `@backend/jvm` + untagged | `@frontend`    |

This means:

- Tag generic backend content as `{.@backend}`. It appears in both `--for backend/node` and `--for backend/jvm`.
- Tag stack-specific content as `{.@backend/node}`. It appears in `--for backend/node` and `--for backend`, but not in `--for backend/jvm`.

### Build a Classification Table

After reading every bullet, produce a table:

```
| Section | Bullet (abbreviated) | Category | Tag(s) |
| --- | --- | --- | --- |
| Work / Google | Reduced API latency by 60%... | Domain-specific | @backend |
| Work / Google | Built microservices with Express... | Domain-specific | @backend/node |
| Work / Google | Led team of 5 engineers... | Universal | (none) |
| Work / Stripe | Built dashboards with React... | Domain-specific | @frontend |
| Work / Stripe | Implemented GraphQL layer... | Multi-domain | @backend @frontend |
| Projects | ML pipeline for sentiment... | Domain-specific | @data/ml/nlp |
```

## Phase 2: Taxonomy Proposal

Present the proposed taxonomy to the user for validation. Include:

### Tag List with Counts

```
Tags:
  @backend        — 6 bullets (4 universal backend, 2 shared)
  @backend/node   — 3 bullets (Node-specific)
  @backend/jvm    — 2 bullets (JVM-specific)
  @frontend       — 5 bullets
  @leadership     — 2 bullets
  Untagged        — 8 bullets (appear in all views)
```

### Suggested Compositions

Based on the tag taxonomy, suggest compositions that match likely job targets:

```yaml
tags:
  fullstack: [frontend, backend]
  node-fullstack: [frontend, backend/node]
  tech-lead: [backend, leadership]
```

Explain each composition: "node-fullstack includes all `@frontend` content, generic `@backend` content, and `@backend/node` content, but excludes `@backend/jvm` content."

### Coverage Check

For each proposed view, list how many bullets would appear:

```
--for backend/node: 14 bullets (8 untagged + 4 @backend + 3 @backend/node - 1 overlap)
--for frontend: 13 bullets (8 untagged + 5 @frontend)
--for fullstack: 19 bullets (8 untagged + 6 @backend + 3 @backend/node + 2 @backend/jvm + 5 @frontend - 5 overlap)
```

Flag any view that seems too thin or too heavy.

### Ask for Approval

"Here's the proposed tagging taxonomy. Does this match the roles you're targeting? Any tags to add, remove, or rename?"

Wait for the user's response before proceeding.

## Phase 3: Application

After the user approves (with any modifications), apply the tags:

### 1. Tag Content

Add `{.@tagname}` to each classified bullet:

```markdown
- Designed REST APIs with OpenAPI documentation {.@backend}
- Built microservices with `Express` and `Bull` queues {.@backend/node}
- Migrated `Spring Boot` monolith to modular architecture {.@backend/jvm}
- Built interactive dashboards with `React` {.@frontend}
- Led team of 5 engineers to deliver project 2 weeks early
```

### 2. Set Up Composition

Add the `tags:` block to frontmatter:

```yaml
---
tags:
  fullstack: [frontend, backend]
  node-fullstack: [frontend, backend/node]
---
```

### 3. Verify Coverage

After applying all tags, run a mental check for each proposed view:

- Every bullet should appear in at least one view
- No bullet should appear in a view where it's irrelevant
- Untagged bullets should genuinely be universal
- Hierarchical tags should follow the parent/child convention consistently (no orphan levels without a reason)

## Counter-Examples

### Over-tagging

```markdown
- Built REST APIs with `Express` {.@backend .@node .@javascript .@api .@rest}
```

One tag is enough. `@backend/node` captures the stack. The recruiter filters by role, not by individual technology.

### Under-tagging

```markdown
- Built interactive dashboards with `React` and `D3.js`
- Designed distributed message queue with `Kafka`
```

Both are untagged. A backend recruiter sees the React dashboard (irrelevant), and a frontend recruiter sees the Kafka queue (irrelevant). Tag each to its domain.

### Tagging universals

```markdown
- Reduced infrastructure costs by 40% through query optimization {.@backend}
```

Cost reduction through optimization is relevant to every engineering role. Leave untagged.

### Wrong level of hierarchy

```markdown
- Deployed services to `Kubernetes` {.@backend/k8s}
```

Kubernetes is an infrastructure tool, not a backend sub-ecosystem. Use `@devops` or `@infra` instead, or just `@backend` if the user isn't targeting infra roles specifically.
