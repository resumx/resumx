# Quick Start

Get from zero to a rendered resume in under a minute.

## 1. Install

```bash
npm install -g resumx
```

PDF rendering uses [Playwright](https://playwright.dev/) with a bundled Chromium browser, installed automatically during `npm install`.

## 2. Create and Render

```bash
resumx init resume.md  # Generate a template resume
resumx resume.md       # Render to PDF
```

<!-- TODO: Terminal screenshot showing the output of resumx init and resumx resume.md commands -->

## 3. Edit

Open `resume.md` in your editor. The template looks like this:

```markdown
# Your Name

[your@email.com](mailto:your@email.com) | [in/yourprofile](https://linkedin.com/in/yourprofile) | [yourusername](https://github.com/yourusername)

## Education

### University Name [Month Year – Month Year]{.right}

_Degree, Major_

- GPA: X.XX
- Relevant coursework: Course 1, Course 2, Course 3

## Work Experience

### Company Name [Month Year – Present]{.right}

_Job Title_

- Built feature X using `Technology` and `Framework`, resulting in Y% improvement
- Led team of Z people to deliver project on time

## Technical Skills

Languages
: JavaScript, TypeScript, Python, SQL

Frameworks
: React, Node.js, Express, FastAPI
```

Edit your content, then run `resumx resume.md` again.  
Or use `resumx resume.md --watch` to auto-rebuild on every save.

## Next Steps

- Read [The Resumx Approach](/the-resumx-approach) to understand how themes, variables, and customization work together
- See the [Markdown Syntax](/markdown-syntax) reference for all supported elements
- Check the [CLI Reference](/cli-reference) for all commands and options
