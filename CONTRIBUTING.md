# Contributing to TaskFlow

Thank you for your interest in contributing! This document outlines the process and guidelines for contributing to TaskFlow.

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Create a branch** for your feature/fix: `git checkout -b feature/your-feature-name`
5. **Make changes** and test locally with `npm run dev`
6. **Commit** with a clear message (see Commit Guidelines below)
7. **Push** your branch and open a Pull Request

---

## Development Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build
```

---

## Code Style

- **Components:** Functional components with hooks (no class components)
- **State:** Zustand stores (one per domain: tasks, groups, chat, auth, app)
- **Styling:** CSS in `src/App.css` with CSS variables for theming
- **Naming:** PascalCase for components, camelCase for functions/variables
- **Imports:** Group by: React → libraries → stores → components → utils → CSS

### File Organization

```
src/components/
  domain/
    ComponentName.jsx    # One component per file
src/stores/
  domainStore.js         # One Zustand store per domain
src/utils/
  helperName.js          # Pure utility functions
```

---

## Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add emoji reactions to chat
fix: resolve group join timeout issue
docs: update user guide
style: improve dark theme contrast
refactor: extract chat message renderer
chore: update dependencies
```

---

## Pull Request Process

1. Ensure your code passes `npm run build` (no build errors)
2. Run `npm run lint` and fix any new errors you introduced
3. Update documentation if you added/changed features
4. Describe what your PR does and why
5. Link any related issues

---

## Reporting Bugs

Open an issue with:
- **Title:** Brief description
- **Environment:** Browser, OS
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if UI-related)

---

## Feature Requests

Open an issue with the `enhancement` label. Describe:
- What problem it solves
- Proposed solution
- Any alternatives considered

---

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on the code, not the person
- No harassment, discrimination, or personal attacks

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
