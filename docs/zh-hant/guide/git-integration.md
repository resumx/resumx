# Git 整合 (Git Superpowers)

對於大多數履歷專案來說，單一分支就已足夠。利用 [標籤與視圖](/guide/tailoring) 來為每個申請客製化內容，並使用 `git tag` 為每次投遞建立快照。

## 渲染過去的版本

透過一次性設定別名，您就能從過去的 commit、標籤 (tag) 或參照 (ref) 渲染您的履歷：

```bash
git resumx sent/stripe-2026-02                  # 渲染一個標籤
git resumx a3f1c2d --for backend              # 特定的 commit，以標籤過濾
git resumx HEAD~3 --css my-styles.css -o stripe  # 3 個 commit 前，自訂 CSS + 輸出路徑
git resumx --for frontend                    # HEAD 使用標籤過濾 (ref 是可選的)
git resumx HEAD@{3 months ago} --format png     # 3 個月前，轉成 PNG 格式
```

只需執行一次以下指令，即可建立 `git resumx` 別名：

```bash
git config alias.resumx '!f() { ref="HEAD"; for arg in "$@"; do case "$arg" in -*) break ;; *) ref="$arg"; shift; break ;; esac; done; git show "$ref":resume.md | resumx "$@"; }; f'
```

### 預覽已暫存的更改 (Preview Staged Changes)

在不影響工作目錄的情況下，渲染您已暫存 (staged) 的變更：

```bash
git show :resume.md | resumx -o resume-staged
```

## Git Hooks

### Commit 時自動驗證

新增一個 pre-commit hook，在有問題的內容進入歷史記錄前就先捕捉它們：

```bash
echo 'resumx --check' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

現在，如果您的履歷存在驗證錯誤、損壞的連結、遺失的區塊或其他結構性問題，`git commit` 將會失敗。

### Commit 時自動渲染

新增一個 post-commit hook，每次 commit 時自動重新渲染您的履歷：

```bash
cat > .git/hooks/post-commit << 'EOF'
#!/bin/sh
resumx resume.md &>/dev/null &
echo "Resume rendering in background..."
EOF
chmod +x .git/hooks/post-commit
```

這樣您的 PDF 就會永遠與最新 commit 保持同步，無須手動操作。
