# Icons

::: info
Some icons may need **internet access** the first time you use them. Resumx caches fetched icons, so later renders usually work without network access.
:::

Resumx supports three kinds of icons: **built-in icons** for companies, tools, and technologies, **custom icons** via frontmatter, and **auto-icons** for links.

## Built-in Icons {#built-in-icons}

Use the `::icon-name::` syntax to embed icons inline in your text. Resumx ships with 200+ built-in icons for popular companies, tools, and technologies. Use them by slug name:

```markdown
::react:: ::docker:: ::aws:: ::python:: ::openai::
```

The slug is the filename without extension from the bundled [`assets/icons/`](https://github.com/ocmrz/resumx/tree/main/assets/icons) directory. Click any icon below to copy its `::slug::` syntax.

<IconGallery />

## Iconify Icons {#iconify-icons}

Use the [Iconify](https://iconify.design/) format with `set:name` syntax for access to 200,000+ icons:

- `::devicon:react::` -- <img src="/icons/devicon:react.svg" alt="devicon:react" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `::logos:kubernetes::` -- <img src="/icons/logos:kubernetes.svg" alt="logos:kubernetes" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `::simple-icons:docker::` -- <img src="/icons/simple-icons:docker.svg" alt="logos:kubernetes" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `::mdi:work::` -- <img src="/icons/mdi:work.svg" alt="mdi:work" style="display: inline-block; height: 1.25em; vertical-align: text-top;">

Browse all available icons at [icon-sets.iconify.design](https://icon-sets.iconify.design/).

## Custom Icons (Frontmatter) {#custom-icons}

Define custom icons in your frontmatter using the `icons` field. Each key is the icon slug, and the value can be an SVG string, a URL, or a base64 data URI.

```markdown
---
icons:
  mycompany: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
  partner: 'https://example.com/partner-logo.svg'
  badge: 'data:image/svg+xml;base64,PHN2Zz4uLi48L3N2Zz4='
---

# Jane Smith

Worked at ::mycompany:: in partnership with ::partner::

Certified ::badge:: holder
```

### Value formats

| Format | Example                         | Description                      |
| ------ | ------------------------------- | -------------------------------- |
| SVG    | `<svg>...</svg>`                | Raw SVG markup, rendered inline  |
| URL    | `https://example.com/logo.svg`  | Remote image, wrapped in `<img>` |
| Base64 | `data:image/svg+xml;base64,...` | Data URI, wrapped in `<img>`     |

### Priority

Frontmatter icons have the **highest priority** and override both built-in and Iconify icons with the same name. This lets you replace any default icon:

```markdown
---
icons:
  react: '<svg xmlns="http://www.w3.org/2000/svg"><circle fill="red" r="10"/></svg>'
---

::react:: <!-- uses your custom SVG instead of the built-in React icon -->
```

### Resolver Order

When resolving `::name::`, Resumx checks these sources in order:

1. **Frontmatter icons** -- custom `icons` from your document's frontmatter
2. **Built-in icons** -- bundled SVGs from `assets/icons/`
3. **Iconify** -- remote icons via the Iconify API (for `prefix:name` format)

## Auto-Icons {#auto-icons}

Links to recognized domains automatically receive their official platform icon. No syntax needed -- just write a normal link.

```markdown
[jane@example.com](mailto:jane@example.com) | [linkedin.com/in/jane](https://linkedin.com/in/jane) | [github.com/jane](https://github.com/jane)
```

Each link above will be prefixed with the appropriate icon (email, LinkedIn, GitHub).

### Supported Domains

| Domain                         | Icon                |
| ------------------------------ | ------------------- |
| `mailto:`                      | Email               |
| `tel:`                         | Phone               |
| `linkedin.com`                 | LinkedIn            |
| `github.com`                   | GitHub              |
| `gitlab.com`                   | GitLab              |
| `bitbucket.org`                | Bitbucket           |
| `stackoverflow.com`            | Stack Overflow      |
| `x.com` / `twitter.com`        | X (Twitter)         |
| `youtube.com` / `youtu.be`     | YouTube             |
| `dribbble.com`                 | Dribbble            |
| `behance.net`                  | Behance             |
| `medium.com`                   | Medium              |
| `dev.to`                       | DEV                 |
| `codepen.io`                   | CodePen             |
| `marketplace.visualstudio.com` | VS Code Marketplace |

### Disabling Auto-Icons

Set the `icons` style property to `none` to hide all auto-icons:

```markdown
---
style:
  icons: none # inline (default) | none
---
```

Or via CLI:

```bash
resumx resume.md --style icons=none
```
