# Icons

::: info
Some icons may need **internet access** the first time you use them. Resumx caches fetched icons, so later renders usually work without network access.
:::

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

### Iconify Format

Use the [Iconify](https://iconify.design/) format with `set:name` syntax:

- `::devicon:react::` → <img src="/icons/devicon:react.svg" alt="devicon:react" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `::logos:kubernetes::` → <img src="/icons/logos:kubernetes.svg" alt="logos:kubernetes" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `::simple-icons:docker::` → <img src="/icons/simple-icons:docker.svg" alt="logos:kubernetes" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `::mdi:work::` → <img src="/icons/mdi:work.svg" alt="mdi:work" style="display: inline-block; height: 1.25em; vertical-align: text-top;">

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

- `::gh:google::` → <img src="/icons/gh:google.png" alt="gh:google" style="display: inline-block; height: 1.25em; vertical-align: text-top;">
- `::gh:ocmrz/resumx/main/docs/public/resumx-logo-lockup-light.svg::`

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

#### Full URL vs Icon Path

The `wiki:` prefix replaces the base URL, so you only need the path portion:

| Full Wikimedia URL                                                         | `wiki:` path                         |
| -------------------------------------------------------------------------- | ------------------------------------ |
| `https://upload.wikimedia.org/wikipedia/commons/f/f1/PwC_2025_Logo.svg`    | `::wiki:f/f1/PwC_2025_Logo.svg::`    |
| `https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg` | `::wiki:2/2f/Google_2015_logo.svg::` |

#### Finding the Icon Path

1. Go to [Wikimedia Commons](https://commons.wikimedia.org/) and search for the logo.
2. On the file page, **right-click the image** and select **"Copy image address"** (or "Copy image link").
3. You should get a URL like:
   `https://upload.wikimedia.org/wikipedia/commons/f/f1/PwC_2025_Logo.svg`
4. Remove the `https://upload.wikimedia.org/wikipedia/commons/` prefix. The remaining part (`f/f1/PwC_2025_Logo.svg`) is your icon path.

::: warning Common Mistake
Do **not** use the image description page URL. The description page looks like:

`https://commons.wikimedia.org/wiki/File:PwC_2025_Logo.svg`

This is the **wiki page about the file**, not the file itself. You need the **direct image URL** from `upload.wikimedia.org`, which contains the hash path (e.g. `f/f1/`).
:::
