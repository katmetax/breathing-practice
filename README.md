# Breathing Practice

A progressive web app (PWA) for guided breathing exercises. Build custom breathing patterns with configurable inhale, hold, exhale, and hold durations, then run sessions by rounds or total time. Audio cues mark each phase transition. Session history is stored locally — no account or server required.

## Features

- Customisable breathing presets (inhale / hold-in / exhale / hold-out durations)
- Two session modes: rounds-based or duration-based
- Audio cues for phase transitions
- Session history with localStorage persistence
- Dark / Light / System theme
- PWA — installable, works offline
- Screen wake lock to keep display on during sessions
- Mobile-responsive design

## Tech stack

| Layer      | Technology               |
| ---------- | ------------------------ |
| Framework  | Vue 3 + TypeScript       |
| Build tool | Vite                     |
| State      | Pinia                    |
| Routing    | Vue Router               |
| Testing    | Vitest + @vue/test-utils |
| Linting    | ESLint + oxlint          |
| Formatting | Prettier                 |
| PWA        | vite-plugin-pwa          |

## Prerequisites

- Node.js 20.19.0+ or 22.12.0+
- pnpm

## Getting started

```bash
pnpm install
```

## Dev commands

| Command           | What it does                         |
| ----------------- | ------------------------------------ |
| `pnpm dev`        | Start dev server with HMR            |
| `pnpm build`      | Type-check + production build        |
| `pnpm preview`    | Preview the production build locally |
| `pnpm test:unit`  | Run unit tests (Vitest)              |
| `pnpm type-check` | TypeScript check only (vue-tsc)      |
| `pnpm lint`       | Run all linters (oxlint + ESLint)    |
| `pnpm format`     | Format code with Prettier            |
