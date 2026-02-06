---
name: markdown-to-json-resume
description: Convert between Markdown and JSON Resume formats. Use when the user asks to export/convert a Markdown file to JSON Resume, import a JSON Resume into Markdown, or mentions JSON Resume in the context of a Markdown file.
---

# Markdown ↔ JSON Resume

Convert between Markdown and [JSON Resume](https://jsonresume.org/schema) in either direction.

## Markdown → JSON Resume

### Workflow

1. Read the `resume.md` file
2. Identify the section type of each `## Heading` (see Section Identification)
3. Extract fields from each section using the mapping tables below
4. Output valid JSON matching the JSON Resume schema
5. Omit empty arrays and undefined/null fields from the output

## Section Identification

Map each `## Heading` to a JSON Resume section by keywords in the heading text:

| JSON Resume key    | Heading keywords                                          |
| ------------------ | --------------------------------------------------------- |
| `work`             | work, experience, employment, career, job, position       |
| `volunteer`        | volunteer, volunteering, community, nonprofit, charity    |
| `education`        | education, academic, school, university, degree           |
| `awards`           | award, prize, honor, scholarship, distinction, fellowship |
| `certificates`     | certificate, certification, license, credential, training |
| `publications`     | publication, paper, article, journal, book                |
| `skills`           | skill, competency, expertise, technical                   |
| `languages`        | language, spoken, linguistic                              |
| `interests`        | hobby, interest, activity, pastime, extracurricular       |
| `references`       | reference, recommendation, referee, endorsement           |
| `projects`         | project, portfolio, contribution                          |
| `basics` (summary) | summary, profile, objective, about, overview              |

## Extraction Rules by Section

### `basics` — Header (everything before the first `## `)

```markdown
# John Doe

> [john@gmail.com](mailto:john@gmail.com) | [(912) 555-4321](tel:+19125554321) | San Francisco, CA | [johndoe.com](https://johndoe.com) | [linkedin.com/in/john](https://linkedin.com/in/john)
```

| Pattern                                                                         | JSON Resume field                                              |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `# Text`                                                                        | `basics.name`                                                  |
| `mailto:` link                                                                  | `basics.email` (link text)                                     |
| `tel:` link                                                                     | `basics.phone` (link text)                                     |
| `https://` link (not social)                                                    | `basics.url` (href)                                            |
| Plain text that looks like a city/location                                      | `basics.location` (parse into `city`, `region`, `countryCode`) |
| Social domain links (see below)                                                 | `basics.profiles[]`                                            |
| Text in a `## Summary`/`## Profile` section, or a plain paragraph in the header | `basics.summary`                                               |

**Social profile detection** — match link href domain:

| Domain                 | `network` value |
| ---------------------- | --------------- |
| `linkedin.com`         | `LinkedIn`      |
| `github.com`           | `GitHub`        |
| `twitter.com`, `x.com` | `Twitter`       |
| `gitlab.com`           | `GitLab`        |
| `facebook.com`         | `Facebook`      |
| `instagram.com`        | `Instagram`     |
| `stackoverflow.com`    | `StackOverflow` |
| `medium.com`           | `Medium`        |
| `dribbble.com`         | `Dribbble`      |
| `behance.net`          | `Behance`       |
| `youtube.com`          | `YouTube`       |
| `dev.to`               | `DEV`           |

Extract `username` from the URL path (e.g., `github.com/john` → username `john`).

### `work` — Entry-based

| Pattern                          | JSON field                |
| -------------------------------- | ------------------------- |
| `### Text`                       | `name` (company/org name) |
| Date range on H3 line            | `startDate`, `endDate`    |
| `_italic text_` on line after H3 | `position`                |
| `- bullet` items                 | `highlights[]`            |
| `[text](url)` in entry           | `url`                     |

### `volunteer` — Same as work, except:

| Pattern         | JSON field                  |
| --------------- | --------------------------- |
| `### Text`      | `organization` (not `name`) |
| `_italic text_` | `position`                  |

### `education`

| Pattern                       | JSON field                                             |
| ----------------------------- | ------------------------------------------------------ |
| `### Text`                    | `institution`                                          |
| Date range on H3 line         | `startDate`, `endDate`                                 |
| `_italic text_`               | Parse into `studyType` and `area` (see Degree Parsing) |
| Bullet matching `GPA: X.XX`   | `score`                                                |
| Bullet matching `coursework:` | `courses[]` (comma-separated)                          |
| `[text](url)`                 | `url`                                                  |

**Degree parsing** — split the italic degree line:

- `"Bachelor of Science in Computer Science"` → studyType: `"Bachelor of Science"`, area: `"Computer Science"`
- `"Ph.D. in Physics"` → studyType: `"Ph.D."`, area: `"Physics"`
- `"MBA"` → studyType: `"MBA"`, area: omit
- Split on `in`, or `,`/`:`/`—` as separator
- Strip honors suffixes: "Summa Cum Laude", "Magna Cum Laude", "Cum Laude", "With Distinction", "First Class Honours", etc.

### `awards` — Dash-separated H3

H3 uses `Title — Awarder` pattern (em-dash or en-dash separator).

| Pattern                   | JSON field               |
| ------------------------- | ------------------------ |
| Text before `—`/`–` in H3 | `title`                  |
| Text after `—`/`–` in H3  | `awarder`                |
| Date on H3 line           | `date`                   |
| Bullets or paragraph text | `summary` (join as text) |

### `certificates` — Dash-separated H3

| Pattern             | JSON field |
| ------------------- | ---------- |
| Text before `—`/`–` | `name`     |
| Text after `—`/`–`  | `issuer`   |
| Date on H3 line     | `date`     |
| `[text](url)`       | `url`      |

### `publications` — Dash-separated H3

| Pattern                   | JSON field    |
| ------------------------- | ------------- |
| Text before `—`/`–`       | `name`        |
| Text after `—`/`–`        | `publisher`   |
| Date on H3 line           | `releaseDate` |
| Bullets or paragraph text | `summary`     |
| `[text](url)`             | `url`         |

### `skills` — Definition list

```markdown
Languages
: Java, Python, TypeScript

Frameworks
: React, Node.js, Spring Boot
```

Each `term: definition` pair becomes one skill entry:

| Pattern                         | JSON field   |
| ------------------------------- | ------------ |
| Term (line before `:`)          | `name`       |
| Comma-separated items after `:` | `keywords[]` |

### `languages` — Definition list

```markdown
English
: Native speaker

French
: Professional working proficiency
```

| Pattern         | JSON field |
| --------------- | ---------- |
| Term            | `language` |
| Definition text | `fluency`  |

### `interests` — Definition list

```markdown
Wildlife
: Ferrets, Unicorns
```

| Pattern               | JSON field   |
| --------------------- | ------------ |
| Term                  | `name`       |
| Comma-separated items | `keywords[]` |

### `references`

```markdown
### Jane Doe

Available upon request.
```

| Pattern    | JSON field  |
| ---------- | ----------- |
| `### Name` | `name`      |
| Body text  | `reference` |

### `projects`

| Pattern                     | JSON field             |
| --------------------------- | ---------------------- |
| `### Text`                  | `name`                 |
| `_italic text_` in/after H3 | `description`          |
| Date range on H3 line       | `startDate`, `endDate` |
| `- bullet` items            | `highlights[]`         |
| `[text](url)`               | `url`                  |

### Date Formatting (Resumx → JSON)

Convert dates to ISO 8601 (`YYYY-MM-DD`):

- `"Jan 2020"` → `"2020-01-01"`
- `"2020"` → `"2020-01-01"`
- `"Present"` / `"Current"` → omit `endDate`
- `"Sept 2019 - June 2024"` → `startDate: "2019-09-01"`, `endDate: "2024-06-01"`

### Output

Return a single JSON object. Omit top-level keys whose arrays would be empty.

---

## JSON Resume → Markdown

### Workflow

1. Read the JSON Resume object
2. Generate `resume.md` using the Resumx Markdown patterns below
3. Omit sections with no data

### `basics` → Header

```markdown
# {name}

> [{email}](mailto:{email}) | [{phone}](tel:{phone}) | {location.city}, {location.region} | [{url}]({url}) | [{profiles[].network}]({profiles[].url})
```

- `name` → `# Name`
- `email` → `[email](mailto:email)` in blockquote
- `phone` → `[phone](tel:phone)` in blockquote
- `url` → `[url](url)` in blockquote
- `location` → plain text `City, Region` in blockquote
- `profiles[]` → `[display text](url)` in blockquote (use `network.com/in/username` as display text for known networks)
- `summary` → plain paragraph after the blockquote, or as a `## Summary` section
- Separate blockquote items with `|`

### `work` → Entry-based section

Section heading: `## Work Experience`

```markdown
### {name} [{startDate} - {endDate}]{.right}

_{position}_

- {highlights[0]}
- {highlights[1]}
```

- If `endDate` is absent, use `Present`
- If `url` exists, make the company name a link: `### [{name}]({url})`

### `volunteer` → Same as work

Section heading: `## Volunteer Experience`

- `organization` → H3 text (instead of `name`)
- `position` → italic line

### `education`

Section heading: `## Education`

```markdown
### {institution} [{startDate} - {endDate}]{.right}

_{studyType} in {area}_

- GPA: {score}
- Relevant coursework: {courses[].join(", ")}
```

- Combine `studyType` and `area` with `in` separator
- If only `studyType`, use it alone
- If `score` exists, add as `GPA: {score}` bullet
- If `courses[]` exists, add as `Relevant coursework: ...` bullet

### `awards` → Dash-separated H3

Section heading: `## Awards`

```markdown
### {title} — {awarder} [{date}]{.right}

- {summary}
```

### `certificates` → Dash-separated H3

Section heading: `## Certificates`

```markdown
### {name} — {issuer} [{date}]{.right}
```

- If `url` exists, make the name a link: `### [{name}]({url}) — {issuer}`

### `publications` → Dash-separated H3

Section heading: `## Publications`

```markdown
### {name} — {publisher} [{releaseDate}]{.right}

- {summary}
```

- If `url` exists, make the name a link

### `skills` → Definition list

Section heading: `## Skills`

```markdown
{name}
: {keywords.join(", ")}
```

### `languages` → Definition list

Section heading: `## Languages`

```markdown
{language}
: {fluency}
```

### `interests` → Definition list

Section heading: `## Interests`

```markdown
{name}
: {keywords.join(", ")}
```

### `references`

Section heading: `## References`

```markdown
### {name}

{reference}
```

### `projects`

Section heading: `## Projects`

```markdown
### {name} [{startDate} - {endDate}]{.right}

_{description}_

- {highlights[0]}
- {highlights[1]}
```

- If `url` exists, make the name a link

### Date Formatting (JSON → Resumx)

Convert ISO 8601 dates to human-readable:

- `"2020-01-01"` → `"Jan 2020"`
- `"2019-09-01"` → `"Sept 2019"`
- If no `endDate`, use `"Present"`

### Section Ordering

Use this default order (skip empty sections):

1. Header (basics)
2. Education
3. Work Experience
4. Projects
5. Skills
6. Awards
7. Certificates
8. Publications
9. Volunteer Experience
10. Languages
11. Interests
12. References

If the user has a preferred order, follow that instead.
