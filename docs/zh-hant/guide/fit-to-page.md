# 適應頁面 (Fit to Page)

```markdown
---
pages: 1
---
```

設定目標頁數。如果內容溢出，排版會自動縮小以適應；如果在單頁上有剩餘空間，它會擴展間距，並在達到可讀性最低標準時停止。

<!-- TODO: side-by-side comparison image — left: 1.1 pages without `pages:`, right: 1 page with `pages: 1` -->

## 用法

將 `pages` 加入您的 frontmatter 中，或從 CLI 傳入：

```bash
resumx resume.md --pages 1
```

這也適用於多頁目標：`pages: 2` 會將 2.2 頁的履歷調整為剛好兩頁。

## 哪些部分會被調整

當內容溢出時，以下變數會縮小以適應：

| 變數                                  | 類型        | 縮小優先級 |
| ------------------------------------- | ----------- | ---------- |
| `row-gap`, `entry-gap`, `section-gap` | 間距        | 第一       |
| `page-margin-x`, `page-margin-y`      | 邊距        | 第二       |
| `font-size`, `line-height`            | 排版 (字體) | 最後       |

間距縮小最快，其次是邊距，而字體大小會抵抗變化，直到溢出量很大時才會調整。輕微的溢出（比如說 1.05 頁）只會縮小間距，而完全不會動到字體大小。較大的溢出會開始減少邊距，只有嚴重的溢出才會縮小字體。

對於 `pages: 1`，如果內容不足一整頁，間距會自動擴展以填滿剩餘空間。

### 最小值限制

沒有變數會低於以下底線：

| 變數            | 底線   |
| --------------- | ------ |
| `font-size`     | 9pt    |
| `line-height`   | 1.15   |
| `section-gap`   | 4px    |
| `entry-gap`     | 1px    |
| `page-margin-y` | 0.3in  |
| `page-margin-x` | 0.35in |

如果內容在達到最小值時仍無法達到目標頁數：

- 如果最小值能減少頁數，則盡最大努力保留這些值。
- 如果最小值無法減少頁數，則保留原始排版以確保可讀性。

### 與 `style:` 的交互作用

當設定了 `pages:` 時，`style:` 的值只是起始點，而不是底線：

```markdown
---
pages: 1
style:
  font-size: 12pt # 視需要可能會被縮小
  section-gap: 15px # 視需要可能會被縮小
---
```

引擎會根據您的值視需要向最小值進行調整。如果沒有設定 `pages:`，樣式值會被原封不動地套用。
