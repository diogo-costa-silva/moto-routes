---
name: commit
description: Atomic commit helper. Analyses staged changes, proposes a well-formed commit message, and executes the commit after user confirmation. Use whenever you want to commit work in progress.
user_invocable: true
allowed_tools:
  - Bash
---

# /commit - Atomic Commit Helper

## Objective

Inspect the current git state, propose one precise and well-formed commit message following the project conventions, then commit only after explicit user approval.

---

## Step-by-Step Instructions

### Step 1 - Inspect git state

Run both commands:

```bash
git status
git diff --cached
```

### Step 2 - Handle "nothing staged" case

If `git status` shows no staged files:

1. List all modified/untracked files clearly.
2. Ask the user which files to stage (do NOT stage anything automatically).
3. Wait for the user's answer before continuing.
4. Once the user specifies files, run `git add <files>` and continue from Step 1.

### Step 3 - Analyse the staged diff

Read the output of `git diff --cached` and identify:

- **Scope**: which part of the codebase is affected (e.g., `frontend`, `pipeline`, `docs`, `schema`, `config`)
- **Nature**: is this a new feature, a bug fix, a refactor, documentation, etc.
- **Size**: is this one logical change or multiple unrelated changes?

If the staged changes cover **more than one unrelated concern**, stop and recommend splitting into atomic commits. Explain which groups of files should go into separate commits.

### Step 3.5 - Documentation sync check

If the staged changes implement **feature work** (components, hooks, pages, scripts, schema changes — anything that advances a phase):

1. Read `PROGRESS.md` and `docs/ROADMAP.md`
2. Check if the work being committed is already reflected there
3. If **not reflected**: warn the user before continuing

Show this warning when docs are out of sync:

```
⚠️  Docs not updated

The following files are not tracked in PROGRESS.md or ROADMAP.md:
- [list the untracked files]

Update the docs in this commit? [y/n]
```

- If **y**: update PROGRESS.md (add completed tasks) and ROADMAP.md (check criteria) before committing, then stage those files too
- If **n**: proceed with the commit as-is (user's choice)

Skip this check if the staged changes are **only** docs, config, style, or test files.

### Step 4 - Generate ONE commit message proposal

Compose the message following these rules:

**Format:**
```
type: short description
```
or, when a scope adds clarity:
```
type(scope): short description
```

**Valid types:**

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `chore` | Tooling, config, deps, scripts |
| `refactor` | Code restructure without behaviour change |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace, no logic change |
| `ci` | CI/CD pipeline changes |
| `perf` | Performance improvement |
| `revert` | Reverting a previous commit |

**Rules for the description:**
- Maximum 72 characters total (including type prefix)
- Written in English
- Imperative mood: "add", "fix", "remove", not "added", "fixes", "removed"
- No trailing period
- No emojis (unless the user explicitly asked for them)
- No references to Claude, AI, or any AI tool
- No verbose body unless the change genuinely requires context that cannot fit in the subject line

**Good vs bad examples:**

| Bad | Good |
|-----|------|
| `fix: add basePath for GitHub Pages sub-path deployment\n\n- Add basePath: '/website-v1'...` | `fix: add basePath to Next.js config` |
| `feat: implement authentication system 🤖 Generated with Claude Code` | `feat(auth): add JWT authentication` |
| `docs: update README.md file with new information about the project setup process` | `docs: update README setup section` |
| `chore: stuff` | `chore: upgrade Tailwind to v4` |
| `fix things` | `fix(map): correct longitude/latitude order in marker placement` |

### Step 5 - Present the proposal to the user

Show exactly:

```
## Commit Proposal

**Message**: `type(scope): description`

**Files included**:
- path/to/file1
- path/to/file2

Confirm? [y/n]
```

Wait for explicit confirmation. Do not commit without it.

### Step 6 - Execute the commit

After user approval, run:

```bash
git commit -m "type(scope): description"
```

Then confirm success by showing the commit hash and summary from git's output.

---

## Edge Cases

### Unstaged changes exist alongside staged changes

Note them to the user but do not stage them automatically. Commit only what is staged.

### Merge commits or rebase in progress

If `git status` indicates a merge or rebase in progress, stop and inform the user. Do not attempt to commit in this state.

### New untracked files present

If there are untracked files that seem related to the staged changes, mention them so the user can decide whether to include them. Never run `git add .` or `git add -A` without explicit instruction.

### Large diffs (>200 lines changed)

For very large diffs, summarise by file rather than reading every line. Focus on what each file's purpose is and the overall intent of the change.

---

## Quality Checklist (internal - do not show to user)

Before proposing, verify:

- [ ] Description is 72 characters or fewer (total line)
- [ ] Type is one of the valid types listed above
- [ ] No AI/Claude references
- [ ] No emojis (unless requested)
- [ ] Imperative mood used
- [ ] Scope is present only when it genuinely adds clarity
- [ ] Single logical concern covered by the staged files
