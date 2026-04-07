# AGENTS.md

This file provides guidance to Cursor when working with code in this repository.

## Commands

```bash
pnpm dev            # Start development server
pnpm build          # Production build
pnpm lint           # Run linter
pnpm type-check     # Run type check
```

## Code style

- Use TypeScript for all new files
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')
- Prefer ES6 `const` for functions over `function()`
- Double quotes, semicolons
- Use functional patterns where possible

## Workflow

- Be sure to typecheck when you're done making a series of code changes
