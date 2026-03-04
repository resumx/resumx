# 語意選擇器 (Semantic Selectors)

Resumx 會在你的 HTML 中加入語意屬性，讓你可以透過 CSS 作為目標來設定樣式。

## 渲染前後對比

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

## 頁首欄位 (Header Fields)

頁首中的聯絡資訊會獲得 `data-field` 屬性：

```css
[data-field='name'] {
	/* h1 姓名 */
}
[data-field='email'] {
	/* 電子郵件連結 */
}
[data-field='phone'] {
	/* 電話連結 */
}
[data-field='profiles'] {
	/* 所有社群個人檔案連結 */
}
[data-network='github'] {
	/* GitHub 個人檔案連結 */
}
[data-field='location'] {
	/* 地點文字 */
}
[data-field='url'] {
	/* 其他連結 */
}
header {
	/* 頁首區塊 */
}
header address {
	/* 聯絡資訊容器 */
}
```

### 欄位類型

| 欄位       | 偵測方式                                           |
| ---------- | -------------------------------------------------- |
| `name`     | `h1` 元素                                          |
| `email`    | 帶有 `mailto:` href 的連結                         |
| `phone`    | 帶有 `tel:` href 的連結                            |
| `profiles` | 連向 LinkedIn、GitHub、GitLab、X 等的連結          |
| `url`      | 其他連結 (作品集、個人網站)                        |
| `location` | 符合城市/州別模式的文字 (例如 "San Francisco, CA") |
| `summary`  | 剩餘的實質性文字 (>10 個字元)                      |

## 區塊 (Sections)

每個 `h2` 及其內容會變成一個帶有 `data-section` 屬性的 `<section>`。你可以隨意命名標題 — Resumx 會自動進行分類：

```css
section[data-section='work'] {
	/* 工作經驗 */
}
section[data-section='education'] {
	/* 教育背景 */
}
section[data-section='skills'] {
	/* 技能 */
}
section[data-section='projects'] {
	/* 專案 */
}
```

### 區塊類型

| 標題範例                             | `data-section` |
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

Resumx 使用模糊比對，因此大多數合理變化的標題都能被識別出來。

## 項目 (Entries)

每個 `h3` 及其內容會被包裝在 `<article class="entry">` 內。區塊內的所有項目都會被分組在一個 `<div class="entries">` 內：

```css
.entries {
	/* 區塊內所有項目的容器 */
}
.entry {
	/* 個別項目 (工作、學位、專案) */
}
```

## 日期 (Dates)

日期會被包裝在帶有 ISO 8601 `datetime` 屬性的 `<time>` 標籤中。日期範圍會獲得一個 `<span class="date-range">` 容器，裡面包含兩個 `<time>` 標籤：

```css
time {
	/* 個別日期 */
}
.date-range {
	/* 日期範圍 (例如 "Jan 2020 – Present") */
}
.date-range time:first-child {
	/* 範圍起始 */
}
.date-range time:last-child {
	/* 範圍結束 */
}
```

諸如 "Present"、"Current" 和 "ongoing" 等關鍵字會被識別為當前日期。
