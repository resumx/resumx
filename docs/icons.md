# Icons

Resumx supports two kinds of icons: **auto-icons** for links and **inline icons** for technology logos.

## Auto-Icons {#auto-icons}

Links to recognized domains automatically receive their official platform icon. No syntax needed — just write a normal link.

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

## Inline Icons {#inline-icons}

Use the `::icon-name::` syntax to embed icons inline in your text. Browse and search 200,000+ available icons at [icon-sets.iconify.design](https://icon-sets.iconify.design/).

```markdown
- Built APIs with ::nodejs:: `Node.js` and ::postgresql:: `PostgreSQL`
- Deployed on ::kubernetes:: `Kubernetes` and ::googlecloud:: `GCP`
- Frontend with ::react:: `React` and ::typescript:: `TypeScript`
```

![add an example image of rendered resume with inline icons]()

### Shorthand Names

![Example of inline tech icons rendered in a resume — React, Node.js, TypeScript, Docker logos appearing inline with text]()

Resumx provides friendly shorthand names for the most common technology icons. Just use the technology name:

```markdown
::react:: → React logo
::nodejs:: → Node.js logo
::python:: → Python logo
::docker:: → Docker logo
::aws:: → AWS logo
::typescript:: → TypeScript logo
```

These shorthands resolve automatically through the built-in devicon and logos icon maps (500+ devicon icons, 1,000+ logos icons).

### Iconify Format

For the full catalog of 200,000+ icons, use the [Iconify](https://iconify.design/) format with `set:name` syntax:

```markdown
::devicon:react:: → React (devicon set)
::logos:kubernetes:: → Kubernetes (logos set)
::simple-icons:docker:: → Docker (simple-icons set)
::mdi:home:: → Home icon (Material Design)
::fa6-brands:github:: → GitHub (Font Awesome 6)
```

Browse all available icons at [icon-sets.iconify.design](https://icon-sets.iconify.design/).

## Remote Icons {#remote-icons}

::: warning EXPERIMENTAL
Remote icon sources are experimental and subject to change in future versions. They may cause longer and less predictable build times.
:::

In addition to the built-in icon sets, Resumx can load icons from remote sources. These require network access during rendering.

### GitHub Icons

Load images directly from GitHub using the `gh:` prefix:

```markdown
::gh:owner:: → GitHub avatar of user/org
::gh:owner/repo/branch/path/icon.svg:: → Raw file from a GitHub repo
```

**Examples:**

```markdown
::gh:google:: → Google's GitHub avatar
::gh:microsoft:: → Microsoft's GitHub avatar
::gh:ocmrz/resumx/main/assets/logo.svg:: → File from a repo
```

### Wikimedia Commons Icons

Load icons from Wikimedia Commons using the `wiki:` prefix:

```markdown
::wiki:path/to/file.svg::
```

**Example:**

```markdown
::wiki:f/f1/PwC_2025_Logo.svg::
```

This loads the SVG from `https://upload.wikimedia.org/wikipedia/commons/`.
