# Contributing to Moto Routes

Thank you for your interest in contributing to Moto Routes.

---

## Code of Conduct

Be respectful, constructive, and professional in all interactions.

---

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/device information
   - Screenshots if applicable

### Suggesting Features

1. Check existing issues and roadmap
2. Create a feature request with:
   - Use case description
   - Proposed solution
   - Alternatives considered

### Submitting Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following our code style
4. Test your changes thoroughly
5. Commit with clear messages: `git commit -m "feat: add route animation"`
6. Push to your fork: `git push origin feature/your-feature`
7. Open a Pull Request

---

## Development Setup

See [Setup Guide](./docs/SETUP.md) for environment configuration.

Quick start:

```bash
# Clone repository
git clone https://github.com/yourusername/moto-routes-v4.git
cd moto-routes-v4

# Activate git hooks (required)
git config core.hooksPath .githooks

# Install dependencies
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development
npm run dev
```

---

## Git Hooks

This project uses git hooks stored in `.githooks/` (versioned in the repository).

### Activating Hooks

After cloning, run once:

```bash
git config core.hooksPath .githooks
```

### Hooks

| Hook | Purpose |
|------|---------|
| `pre-commit` | Detects accidentally staged secrets; warns on debug code |
| `commit-msg` | Validates commit message format |
| `prepare-commit-msg` | Injects format guide into editor (when not using `/commit`) |
| `pre-push` | Runs typecheck and lint before push |

### commit-msg

Enforces `type: description` or `type(scope): description` before every commit. Invalid messages are rejected with examples.

### pre-commit

Scans staged file contents (not disk) for:
- `.env` files staged directly
- Supabase JWT keys and service role keys
- Mapbox tokens (`pk.*`, `sk.*`)
- Stripe keys (`sk_live_`, `sk_test_`, `pk_live_`)

Secrets belong in `.env` (which is in `.gitignore`), never in source code.

Also warns (non-blocking) on debug code: `console.log()`, `debugger;`, `print(DEBUG...)`.

### prepare-commit-msg

Injects a commented format guide into the editor when you run `git commit` directly. Skipped for merge, squash, and amend commits. Has no effect when using the `/commit` skill.

### pre-push

Runs TypeScript typecheck and lint before pushing. Blocks push if either fails. Only active when `frontend/` exists.

---

## Code Style

### TypeScript

- Strict mode enabled
- No implicit `any`
- Prefer interfaces over types for objects
- Use meaningful variable names

### React

- Functional components with hooks
- One component per file
- Props interface at top of file
- Custom hooks in `hooks/` directory

### Commits

Follow conventional commits. Scope is optional but encouraged for clarity.

Format: `type: description` or `type(scope): description`

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code refactoring |
| `test` | Adding tests |
| `chore` | Maintenance |
| `ci` | CI/CD changes |
| `perf` | Performance improvement |
| `revert` | Revert a previous commit |

Examples:
- `feat: add route animation on map load`
- `fix: correct coordinate order in GPX parser`
- `feat(map): add fly-to animation on route select`
- `fix(pipeline): correct coordinate order`
- `docs: update schema for journey table`
- `chore(deps): update supabase client`

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` with `use` prefix
- Utilities: `camelCase.ts`
- Types: `PascalCase` in type definitions

---

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows project style
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] Changes tested locally
- [ ] Documentation updated if needed

### PR Description

Include:
- What changes were made
- Why the changes were needed
- How to test the changes
- Screenshots for UI changes

### Review Process

1. Automated checks must pass
2. Code review by maintainer
3. Address feedback
4. Merge when approved

---

## Adding Routes

To contribute new motorcycle routes:

1. Record GPS track using any GPS device/app
2. Export as GPX 1.1 format
3. Ensure quality:
   - Minimum 50 trackpoints
   - Maximum 500m gap between points
   - UTF-8 encoding
4. Place in appropriate `data/` subdirectory
5. Test import with pipeline script
6. Submit PR with route metadata

See [Data](./docs/DATA.md) for format requirements.

---

## Questions?

- Check [Documentation](./docs/INDEX.md)
- Open an issue for questions
- Review [Patterns](./docs/PATTERNS.md) for best practices

---

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
