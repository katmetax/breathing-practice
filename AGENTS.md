# AGENTS.md

This file provides guidance to Cursor when working with code in this repository.

## Commands

```bash
pnpm dev            # Start development server
pnpm build          # Production build
pnpm test:unit      # Run unit tests
pnpm lint           # Run linter
pnpm type-check     # Run type check
```

## Code style

- Use TypeScript for all new files
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')
- Prefer function declarations for named, reusable functions.
- Use arrow functions instead of `function()`
- Use double quotes, semicolons
- Use functional patterns where possible
- Prefer named exports. Use default exports only when a framework contract requires them.

## Workflow

- Be sure to typecheck when you're done making a series of code changes
