---
name: writing-resume
description: Write and format resumes using Resumx markdown syntax. Use when creating resumes, CVs, converting resume content to markdown, or when the user mentions resume, CV, or job application documents.
---

# Writing Resumes with Resumx

A minimal markdown-based resume format. Only ONE custom syntax for positioning (`{.right}` or `(#right)`), everything else is standard markdown.

## Interactive Resume Creation

When the user wants to create a new resume, start an interactive chat session to collect all necessary information before generating the resume.

### Step 1: Introduction

Greet the user and explain the process:

"I'll help you create a professional resume in Resumx markdown format. I'll ask you a series of questions to gather all the necessary information. You can skip any section by saying 'skip' or provide as much detail as you'd like."

### Step 2: Collect Basic Information

Ask all contact questions together:

"Let's start with your basic information. Please provide:

1. Your full name
2. Phone number
3. Email address
4. LinkedIn profile URL (or say 'skip')
5. GitHub profile URL (or say 'skip')
6. Any other portfolio or website URL (or say 'skip')"

### Step 3: Collect Education

Ask: "Let's add your education. For each school/degree, please provide:

- University/Institution name
- Degree name (e.g., Bachelor of Science in Computer Science)
- Dates (e.g., Sept 2019 - June 2024)
- GPA (or say 'skip')
- Any relevant coursework, honors, or achievements (or say 'skip')

How many schools/degrees do you want to list? Please provide all details for each one."

### Step 4: Collect Work Experience

Ask: "Now let's add your work experience. How many positions do you want to list?"

For each position, collect basic info first:

"For position [#], please provide:

- Company name
- Job title
- Employment type (e.g., Full-time, Intern, Contract)
- Dates (e.g., Jan 2020 - Present)"

Then guide achievement writing with these prompts:

"Now let's craft 2-5 strong achievement bullets for this role. I'll help you write them using the **Action-Result-Technology** framework. For each accomplishment, think about:

**What to focus on:**

- Problems you solved
- Features you built
- Processes you improved
- Teams you led or collaborated with
- Systems you designed or optimized

**I'll ask you these questions to help:**

1. **Describe what you did** - Tell me about a key project or responsibility in your own words. What was the situation and what did you do?

2. **What was the impact?** - Think about:
   - Speed improvements? (e.g., 'reduced response time by 40%', 'deployed 2 weeks early')
   - Scale? (e.g., '500+ daily users', 'processed 1M transactions')
   - Quality? (e.g., 'reduced bugs by 30%', 'improved test coverage to 90%')
   - Team impact? (e.g., 'led team of 5', 'mentored 3 junior developers')
   - Cost savings? (e.g., 'reduced AWS costs by $10K/month')

   If you can't quantify, describe the qualitative impact (e.g., 'improved user experience', 'enabled new feature capability')

3. **What technologies did you use?** (e.g., Python, React, AWS, Docker, PostgreSQL)

**Examples of strong bullets:**

- Reduced API response time by 40% by implementing `Redis` caching layer, improving experience for 10K+ daily users
- Led team of 5 engineers to migrate legacy monolith to microservices using `Docker` and `Kubernetes`, completing 2 weeks ahead of schedule
- Built real-time analytics dashboard with `React` and `WebSockets`, enabling product team to make data-driven decisions

**Weak bullets to avoid:**

- Worked on backend development
- Responsible for database management
- Helped with various features

Please share your accomplishments for this role, and I'll help you format them into strong bullet points."

### Step 5: Collect Projects

Ask: "Would you like to add projects? If yes, for each project please provide:

- Project name
- Type (Individual/Group)
- Description of what you built
- Technologies used
- Demo video, GitHub link, or live URL (or say 'skip')

How many projects? Please provide all details for each one, or say 'skip' to skip this section."

### Step 6: Collect Technical Skills

Ask: "Let's organize your technical skills. Please provide your skills grouped by categories.

For example:

- **Languages**: Java, Python, TypeScript
- **Frameworks**: React, Node.js, FastAPI
- **Cloud & DevOps**: AWS, Docker, GitHub Actions

Please list all your categories and the skills under each."

### Step 7: Optional Sections

Ask: "Would you like to add any of these optional sections? For each one you want to include, provide the details:

- **Awards/Certifications**: Award name, organization, date
- **Publications**: Title, venue, date
- **Volunteer Work**: Organization, role, dates, description
- **Other sections**: Let me know what else you'd like to include

Please list which sections you want and provide all details, or say 'skip' to skip."

### Step 8: Generate Resume

After collecting all information, say:

"Great! I have all the information I need. I'll now generate your resume in Resumx markdown format."

Then create a resume markdown file following these guidelines:

**File Naming Convention:**

- Name the file using the candidate's name in Pascal_Case with underscores
- Format: `FirstName_LastName_Resume.md`
- Examples:
  - Chan Yat Fu → `Chan_Yat_Fu_Resume.md`
  - John Smith → `John_Smith_Resume.md`
  - Maria Garcia Lopez → `Maria_Garcia_Lopez_Resume.md`

**Content:**
Follow the structure and best practices detailed below to create a well-formatted resume.

## Quick Reference

| Element  | Syntax                                                         |
| -------- | -------------------------------------------------------------- |
| Name     | `# Full Name`                                                  |
| Contact  | `> [phone](tel:...) \| [email](mailto:...) \| [linkedin](url)` |
| Section  | `## Section Name`                                              |
| Entry    | `### Title [Date]{.right}`                                     |
| Subtitle | `*Role or Degree*`                                             |
| Bullets  | `- Achievement with \`tech\` tags`                             |
| Skills   | Definition list (see below)                                    |

## Right-Alignment Syntax

Two equivalent syntaxes for right-aligned dates:

**Pandoc/markdown-it-attrs**

```markdown
### Company Name [Jan 2020 - Present]{.right}
```

**Link hack (any parser)**

```markdown
### Company Name [Jan 2020 - Present](#right)
```

## Resume Structure Template

```markdown
# Full Name

> [+1 555-123-4567](tel:+15551234567) | [email@example.com](mailto:email@example.com) | [linkedin.com/in/user](https://linkedin.com/in/user)

## Education

### University Name [Sept 2019 - June 2024]{.right}

_Degree Name_

- GPA: 3.85
- Relevant coursework or honors

## Work Experience

### Company Name [Start - End]{.right}

_Job Title - Employment Type_

- Achievement with quantified impact using `Technology`
- Another accomplishment

## Projects

### Project Name _(Individual/Group)_

- Description of what was built
- [Demo Video](https://youtu.be/...)

## Technical Skills

Languages
: Java, Python, TypeScript

Frameworks
: React, Node.js, FastAPI

Cloud & DevOps
: AWS, Docker, GitHub Actions
```

## Section-Specific Guidelines

### Header

- Name as `# Full Name` (centered automatically)
- Contact in blockquote with `|` separators
- Use `tel:` and `mailto:` prefixes for phone/email (auto-icons appear)

### Work Experience

- Company name with date range: `### Company [Date]{.right}`
- Role in italics: `*Job Title - Type*`
- Bullets start with action verbs, include metrics
- Tech in backticks: `Node.js`, `React`

### Education

- School with date: `### University [Date]{.right}`
- Degree in italics: `*BEng in Computer Science*`
- GPA, honors, coursework as bullets

### Projects

- Project name with type: `### Name *(Individual)*`
- Type goes in italics after title, not right-aligned
- Include demo links when available

### Awards/Certifications

- Use `\[Date\]` for literal brackets: `[\[Jun 2024\]]{.right}`
- Format: `### Award — Organization [\[Date\]]{.right}`

### Technical Skills

Use definition list syntax:

```markdown
Category
: Item1, Item2, Item3
```

## Writing Best Practices

### Achievement Bullets

- Start with strong action verbs (Led, Developed, Engineered, Increased)
- Include quantified results when possible (20% improvement, 500+ users)
- Mention technologies used with backticks

**Good:**

```markdown
- Reduced API response time by 40% by implementing Redis caching
- Led a team of 5 developers to deliver the project 2 weeks ahead of schedule
```

**Avoid:**

```markdown
- Worked on the backend
- Responsible for database stuff
```

### Date Formats

Be consistent. Recommended formats:

- `Jan 2020 - Present`
- `June 2023 - January 2024`
- `[Oct 2023]` for single events (escaped: `[\[Oct 2023\]]`)

## Auto-Icons

Links to these domains automatically show icons:

| Domain                     | Icon     |
| -------------------------- | -------- |
| `mailto:`                  | Email    |
| `tel:`                     | Phone    |
| `linkedin.com`             | LinkedIn |
| `github.com`               | GitHub   |
| `youtube.com` / `youtu.be` | YouTube  |

## Building the Resume

```bash
# Create resume from template
resumx init

# Build all formats (PDF, HTML, Word)
resumx resume.md --all

# Build PDF only (default output)
resumx resume.md --pdf

# Build HTML only
resumx resume.md --html

# Build DOCX document only
resumx resume.md --docx

# Use a specific theme
resumx resume.md --theme formal
resumx resume.md --theme classic

# Custom output filename
resumx resume.md -o john-doe

# Override CSS variables
resumx resume.md --var primary-color=#2563eb --var font-size=11pt

# Watch mode (auto-rebuild on changes)
resumx resume.md --watch

# List available themes
resumx theme

# Set default theme
resumx theme --default formal
```

## Common Mistakes

1. **Missing escapes**: Use `\[Oct 2023\]` for literal brackets in dates
2. **Wrong right-align syntax**: Use `{.right}` not `{.date}` or `{right}`
3. **Inconsistent date formats**: Pick one style and stick with it
4. **Missing tech backticks**: Always wrap technologies in backticks
5. **Vague bullets**: Always quantify achievements when possible
