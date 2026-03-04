# 语义化选择器

Resumx 会为生成的 HTML 添加语义化属性，你可以通过 CSS 来选择这些属性。

## 转换前后

::: code-group

```markdown [Markdown]
# Jane Doe

jane@example.com | github.com/jane

## Experience

### Google Jan 2022 - Present

- Built distributed systems...
```

```html-vue [生成的 HTML]
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

## 头部字段 (Header Fields)

头部的联系信息会获得 `data-field` 属性：

```css
[data-field='name'] {
	/* h1 姓名 */
}
[data-field='email'] {
	/* 电子邮件链接 */
}
[data-field='phone'] {
	/* 电话链接 */
}
[data-field='profiles'] {
	/* 所有社交媒体个人资料链接 */
}
[data-network='github'] {
	/* GitHub 个人资料链接 */
}
[data-field='location'] {
	/* 位置文本 */
}
[data-field='url'] {
	/* 其他链接 */
}
header {
	/* 头部区域 */
}
header address {
	/* 联系信息包裹器 */
}
```

### 字段类型

| 字段       | 检测方式                                           |
| ---------- | -------------------------------------------------- |
| `name`     | `h1` 元素                                          |
| `email`    | 带有 `mailto:` href 的链接                         |
| `phone`    | 带有 `tel:` href 的链接                            |
| `profiles` | 链接到 LinkedIn、GitHub、GitLab、X 等              |
| `url`      | 其他链接（作品集、个人网站）                       |
| `location` | 匹配城市/州模式的文本（例如，“San Francisco, CA”） |
| `summary`  | 剩余的实质性文本（大于 10 个字符）                 |

## 章节 (Sections)

每个 `h2` 及其内容都会成为一个带有 `data-section` 属性的 `<section>`。你可以随意命名你的标题 — Resumx 会自动对它们进行分类：

```css
section[data-section='work'] {
	/* 工作经验 */
}
section[data-section='education'] {
	/* 教育经历 */
}
section[data-section='skills'] {
	/* 技能 */
}
section[data-section='projects'] {
	/* 项目 */
}
```

### 章节类型

| 示例标题                             | `data-section` |
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

Resumx 使用模糊匹配，所以绝大多数合理的标题变体都能被识别。

## 条目 (Entries)

每个 `h3` 及其内容被包裹在一个 `<article class="entry">` 中。一个章节内的所有条目都会被分组到一个 `<div class="entries">` 里：

```css
.entries {
	/* 一个章节中所有条目的容器 */
}
.entry {
	/* 单个条目（工作、学位、项目） */
}
```

## 日期 (Dates)

日期会被包裹在带有 ISO 8601 `datetime` 属性的 `<time>` 标签中。日期范围会获得一个包含两个 `<time>` 标签的 `<span class="date-range">` 包裹器：

```css
time {
	/* 单个日期 */
}
.date-range {
	/* 日期范围（例如，“Jan 2020 – Present”） */
}
.date-range time:first-child {
	/* 范围开始 */
}
.date-range time:last-child {
	/* 范围结束 */
}
```

像 "Present"、"Current" 和 "ongoing" 这样的关键字会被识别为当前日期。
