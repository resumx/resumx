# What is Resumx?

<span class="pronounce" data-pronounce="/rɪˈzuːmɪx/ — like resu-mix">**Resumx**</span> (**Resu**me **M**arkdown e**X**pression) renders resumes from Markdown.

It automatically [**fits content to the page**](/fit-to-page), shrinking spacing, font size, and margins when content overflows and expanding them when it's short.

<!-- prettier-ignore-start -->
```markdown
---
themes: [zurich, oxford]
pages: 1
style:
  section-title-caps: small-caps
---
# Jane Doe
jane@example.com | github.com/jane | linkedin.com/in/jane

## Experience

### :meta: Meta || June 2022 - Present
_Senior Software Engineer_

- Built distributed systems serving 1M requests/day {.role:backend}
- Built interactive dashboards using :ts: TypeScript {.role:frontend .role:fullstack}

## Technical Skills
::: {.grid .grid-cols-2}
- TypeScript
- React
- Vue
- PostgreSQL
:::
```
<!-- prettier-ignore-end -->

Render with:

```bash
resumx resume.md --format pdf,docx,html
```

<script setup>
function disableLinks(e) {
  try {
    const doc = e.target.contentWindow.document;
    doc.addEventListener('click', event => {
      if (event.target.closest('a')) {
        event.preventDefault();
      }
    });
  } catch (err) {
    console.error(err);
  }
}
</script>

<style scoped>
.resume-preview {
  width: 100%;
  height: 345px;
  border: 1px solid var(--vp-c-gray-soft);
  border-radius: 8px;
  transition: border-color 0.2s ease-out;
}

.resume-preview:hover {
  border-color: var(--vp-c-gray-1);
}
</style>

<figure>
  <iframe
    src="/samples/resumx-snippet-frontend-zurich.html"
    class="resume-preview"
    loading="lazy"
    @load="disableLinks"
  ></iframe>
  <figcaption>Rendered sample of the snippet above, Zurich theme, frontend role.</figcaption>
</figure>

<!-- <figure>
  <img
    src="/images/resumx-snippet-zurich-frontend.png"
    alt="Rendered sample of the snippet above, Zurich theme, frontend role"
  />
  <figcaption>Rendered sample of the snippet above, Zurich theme, frontend role.</figcaption>
</figure> -->

That produces a file for every combination of **role**, **theme**, and **format** (3 roles × 2 themes × 3 formats = 18 files). Each [theme](/themes) gives the same content a different look:

<!-- TODO: Side-by-side comparison of full resumes rendered in the Zurich, Oxford, and Seattle themes -->

Edit with [AI](/using-ai). Render from [any commit](/git-superpowers). [Multi-language](/multi-language) from one source. [Get started in under a minute →](/quick-start)
