# Working Protocol — Moto Routes v4

> Mandatory process for any task touching more than 2 files.
> This file is imported by CLAUDE.md — do not duplicate its content there.

---

## Before Writing Any Code

### 1. Understand the codebase
```
codegraph_context("description of what you're about to change")
codegraph_impact("SymbolYouPlanToChange")
```

### 2. Check existing decisions and debt
- Read `docs/AUDIT.md` — are the files you're about to touch flagged?
- Read `docs/DECISIONS.md` — does a DEC-XXX already cover this pattern?
- Read `.planning/ROADMAP.md` — what do future phases need from this code?

### 3. Look up current library docs (always — APIs change)
Use Context7 before implementing anything with an external library:
```
mcp__context7__resolve-library-id → mcp__context7__query-docs
```
Mandatory for: `mapbox-gl`, `@supabase/supabase-js`, `react-router`, `react`, `tailwindcss`, `i18next`, `vite`

### 4. Record the architectural decision before coding
Add a `DEC-XXX` entry to `docs/DECISIONS.md` for any decision that:
- Chooses one approach over alternatives
- Will be repeated in future phases
- Affects how other components must be written

### 5. Decompose into specialized subtasks

Run independent subtasks **in parallel** using specialized agents:

| Subtask | Agent |
|---------|-------|
| React components, hooks, Supabase integration | `react-builder` |
| Mapbox GL layers, sources, animations | `map-specialist` |
| PostGIS queries, migrations, schema | `db-helper` |
| Visual UI, Tailwind consistency | `ui-designer` |
| PT/EN translations, i18n keys | `i18n-helper` |
| GPX scripts, Python pipeline | `python-pipeline` |
| Docs, ADRs, DECISIONS.md entries | `doc-writer` |
| Bugs, errors, diagnosis | `bug-hunter` |
| Code quality, refactoring | `refactorer` |
| Pre-commit review | `code-reviewer` |
| Unit/integration tests | `test-writer` |

### 6. For complete phases (5+ files): use GSD

Instead of manual agents, use GSD for full phase execution:
- `/gsd:plan-phase N` — research + creates atomic PLAN.md
- `/gsd:execute-phase N` — executes with fresh contexts + parallel waves
- `/gsd:verify-work` — post-execution validation

For direct worktree isolation:
```
EnterWorktree(name="descriptive-name")
```
Work in isolation. Merge to main only after all validation criteria pass.
Worktrees live in `.claude/worktrees/` and are cleaned up automatically if no changes are made.

---

## Known Anti-Patterns — Never Repeat

These caused architectural debt in this project. Do not introduce new instances:

| Anti-pattern | Problem | Correct approach |
|---|---|---|
| `new mapboxgl.Map()` per page component | ~500ms reload on tab switch | One shared instance via layout route + MapContext (DEC-014) |
| `useAuth()` called in multiple components | N duplicate Supabase subscriptions | One `AuthProvider` at root, one subscription (A-02 in AUDIT.md) |
| `LoginModal` rendered in multiple places | 3 independent DOM instances | One instance at layout root (A-03 in AUDIT.md) |
| `fetchTranslations()` called per hook | Redundant Supabase requests | Module-level cache in `translations.ts` (A-04 in AUDIT.md) |
| GPX logic copy-pasted per component | Maintenance burden | Extract to `lib/gpx.ts` (A-06 in AUDIT.md) |
| Skeleton components defined locally | 6 duplicates | Shared `Skeleton.tsx` component (A-11 in AUDIT.md) |

---

## Architectural Review Checklist

Ask these before implementing any pattern that will be repeated:

- [ ] Does this pattern scale to future phases? (read ROADMAP)
- [ ] If this component is repeated (map, details panel, list), will each copy be independent or share state?
- [ ] If fetching data, will the same data be fetched again in the next phase?
- [ ] If adding a React hook, will it create duplicate subscriptions if called in multiple components?
- [ ] Is there already a DEC-XXX that covers this? Am I contradicting it?
