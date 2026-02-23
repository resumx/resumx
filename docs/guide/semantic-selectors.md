# Semantic Selectors

Resumx adds semantic attributes to your HTML that you can target with CSS.

## Before and After

::: code-group

```markdown [Markdown]
# Jane Doe

jane@example.com | github.com/jane

## Experience

### Google Jan 2022 - Present

- Built distributed systems...
```

```html-vue [Generated HTML]
<header>
    <h1 data-field="name">Jane Doe</h1>
    <address><a data-field="email" href="mailto:jane@example.com">jane@example.com</a> | <a data-username="jane" data-network="github" data-field="profiles" href="http://github.com/jane">github.com/jane</a></address>
</header>
<section data-section="work" id="experience">
    <h2>Experience</h2>
    <div class="entries">
        <article class="entry">
            <h3>Google <span class="date-range"><time datetime="2022-01">Jan 2022</time> - <time datetime="{{new Date().toISOString().slice(0, 10)}}">Present</time></span></h3>
            <ul>
                <li>Built distributed systems…</li>
            </ul>
        </article>
    </div>
</section>
```

:::

## Header Fields

Contact information in the header gets `data-field` attributes:

```css
[data-field='name'] {
	/* The h1 name */
}
[data-field='email'] {
	/* Email links */
}
[data-field='phone'] {
	/* Phone links */
}
[data-field='profiles'] {
	/* All social profile links */
}
[data-network='github'] {
	/* GitHub profile links */
}
[data-field='location'] {
	/* Location text */
}
[data-field='url'] {
	/* Other links */
}
header {
	/* Header section */
}
header address {
	/* Contact information wrapper */
}
```

### Field Types

| Field      | Detection                                                     |
| ---------- | ------------------------------------------------------------- |
| `name`     | The `h1` element                                              |
| `email`    | Links with `mailto:` href                                     |
| `phone`    | Links with `tel:` href                                        |
| `profiles` | Links to LinkedIn, GitHub, GitLab, X, etc.                    |
| `url`      | Other links (portfolio, personal site)                        |
| `location` | Text matching city/state patterns (e.g., "San Francisco, CA") |
| `summary`  | Remaining substantial text (>10 characters)                   |

## Sections

Each `h2` and its content becomes a `<section>` with a `data-section` attribute. You can name your headings however you like — Resumx classifies them automatically:

```css
section[data-section='work'] {
	/* Work experience */
}
section[data-section='education'] {
	/* Education */
}
section[data-section='skills'] {
	/* Skills */
}
section[data-section='projects'] {
	/* Projects */
}
```

### Section Types

| Example headings                     | `data-section` |
| ------------------------------------ | -------------- |
| Experience, Work, Employment, ...    | `work`         |
| Education, Academic Background, ...  | `education`    |
| Skills, Technical Skills, ...        | `skills`       |
| Projects, Portfolio, ...             | `projects`     |
| Awards, Honors, Scholarships, ...    | `awards`       |
| Certifications, Licenses, ...        | `certificates` |
| Publications, Papers, ...            | `publications` |
| Volunteering, Community Service, ... | `volunteer`    |
| Languages, Spoken Languages, ...     | `languages`    |
| Hobbies, Interests, ...              | `interests`    |
| References, Recommendations, ...     | `references`   |
| Summary, Profile, Objective, ...     | `basics`       |

Resumx uses fuzzy matching, so most reasonable variations of these headings will be recognized.

## Entries

Each `h3` and its content is wrapped in an `<article class="entry">`. All entries within a section are grouped inside a `<div class="entries">`:

```css
.entries {
	/* Container for all entries in a section */
}
.entry {
	/* Individual entry (job, degree, project) */
}
```

## Dates

Dates are wrapped in `<time>` tags with ISO 8601 `datetime` attributes. Date ranges get a `<span class="date-range">` wrapper containing two `<time>` tags:

```css
time {
	/* Individual date */
}
.date-range {
	/* A date range (e.g., "Jan 2020 – Present") */
}
.date-range time:first-child {
	/* Range start */
}
.date-range time:last-child {
	/* Range end */
}
```

Keywords like "Present", "Current", and "ongoing" are recognized as the current date.

## Two-Column Layout

A `---` (horizontal rule) splits content into a two-column grid. Everything above the rule becomes the primary column, everything below becomes the secondary:

```markdown
# Jane Doe

jane@example.com | github.com/jane

## Experience

...

## Projects

...

---

## Skills

...

## Education

...
```

This produces:

```html
<div class="two-column-layout">
	<header>
		<h1 data-field="name">Jane Doe</h1>
		<address>
			<a data-field="email" href="mailto:jane@example.com">jane@example.com</a>
			|
			<a
				data-username="jane"
				data-network="github"
				data-field="profiles"
				href="http://github.com/jane"
				>github.com/jane</a
			>
		</address>
	</header>
	<div class="primary">
		<section data-section="work" id="experience">
			<h2>Experience</h2>
			<p>…</p>
		</section>
		<section data-section="projects" id="projects">
			<h2>Projects</h2>
			<p>…</p>
		</section>
	</div>
	<div class="secondary">
		<section data-section="skills" id="skills">
			<h2>Skills</h2>
			<p>…</p>
		</section>
		<section data-section="education" id="education">
			<h2>Education</h2>
			<p>…</p>
		</section>
	</div>
</div>
```

The header spans both columns via CSS grid areas.

```css
.two-column-layout {
	/* The grid container */
}
.two-column-layout > .primary {
	/* Left/main column */
}
.two-column-layout > .secondary {
	/* Right/sidebar column */
}
```
