# Git Superpowers

A single branch works well for most resume projects. Use [per-role output](/per-role-output) and command flags to tailor each application, and `git tag` to snapshot submissions.

## Render Past Version

With a one-time alias setup, you can render your resume from past commits, tags, or refs:

```bash
git resumx sent/stripe-2026-02                  # render a tag
git resumx a3f1c2d --role backend               # specific commit, filtered by role
git resumx HEAD~3 --theme zurich -o stripe      # 3 commits ago, custom theme + output
git resumx --role frontend                      # HEAD with role filter (ref is optional)
git resumx HEAD@{3 months ago} --png            # 3 months ago, as PNG
```

Run this once to create the `git resumx` alias:

```bash
git config alias.resumx '!f() { ref="HEAD"; for arg in "$@"; do case "$arg" in -*) break ;; *) ref="$arg"; shift; break ;; esac; done; git show "$ref":resume.md | resumx "$@"; }; f'
```

### Preview Staged Changes

Render your staged changes without affecting the working tree:

```bash
git show :resume.md | resumx -o resume-staged
```

## Git Hooks

### Auto-Validation on Commit

Add a pre-commit hook to catch issues before they land in your history:

```bash
echo 'resumx validate --strict' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Now `git commit` will fail if your resume has validation errors — broken links, missing sections, or other structural issues.

### Auto-Render on Commit

Add a post-commit hook to automatically re-render your resume every time you commit:

```bash
cat > .git/hooks/post-commit << 'EOF'
#!/bin/sh
resumx resume.md &>/dev/null &
echo "Resume rendering in background..."
EOF
chmod +x .git/hooks/post-commit
```

Your PDF always stays in sync with your latest commit without thinking about it.
