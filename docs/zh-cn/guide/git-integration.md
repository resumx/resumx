# Git 超级能力

单一分支对于大多数简历项目来说效果很好。使用 [标签和视图](/guide/tailoring) 为每次申请量身定制，并使用 `git tag` 为提交生成快照。

## 渲染过去的版本

通过一次性别名设置，你可以从过去的提交、标签或引用渲染简历：

```bash
git resumx sent/stripe-2026-02                  # 渲染标签
git resumx a3f1c2d --for backend              # 特定提交，按标签过滤
git resumx HEAD~3 --css my-styles.css -o stripe  # 3 个提交之前，自定义 CSS + 输出
git resumx --for frontend                    # 使用标签过滤的 HEAD（引用是可选的）
git resumx HEAD@{3 months ago} --format png     # 3 个月前，保存为 PNG
```

运行此命令一次以创建 `git resumx` 别名：

```bash
git config alias.resumx '!f() { ref="HEAD"; for arg in "$@"; do case "$arg" in -*) break ;; *) ref="$arg"; shift; break ;; esac; done; git show "$ref":resume.md | resumx "$@"; }; f'
```

### 预览暂存区更改

渲染你的暂存区更改，而不会影响工作树：

```bash
git show :resume.md | resumx -o resume-staged
```

## Git Hooks

### 提交时自动验证

添加一个 pre-commit 钩子，以便在问题进入你的历史记录之前捕获它们：

```bash
echo 'resumx --check' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

现在，如果你的简历存在验证错误、断开的链接、缺失的部分或其他结构性问题，`git commit` 将失败。

### 提交时自动渲染

添加一个 post-commit 钩子，以便每次提交时自动重新渲染你的简历：

```bash
cat > .git/hooks/post-commit << 'EOF'
#!/bin/sh
resumx resume.md &>/dev/null &
echo "Resume rendering in background..."
EOF
chmod +x .git/hooks/post-commit
```

你的 PDF 将始终在不知不觉中与你的最新提交保持同步。
