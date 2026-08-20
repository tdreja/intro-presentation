# AGENTS.md

## Project

React app (Vite + TypeScript) that compiles to a **single HTML file** via `vite-plugin-singlefile`. Slides communicate across browser tabs via a custom event bus.

## Commands

```bash
npm run dev          # dev server
npm run build        # tsc -b && vite build → dist/
npm run lint         # eslint
npm run lint:fix     # eslint --fix
npm test             # vitest run (all tests)
```

### Run a single test file

```bash
npx vitest run src/path/to/File.test.ts   # match by file path
```

## TypeScript setup — three tsconfigs

| Config | Covers | Notes |
|---|---|---|
| `tsconfig.app.json` | `src/` (includes `*.test.ts`) | bundler module resolution, `noEmit` |
| `tsconfig.node.json` | `vite.config.ts` | nodenext modules |

Root `tsconfig.json` is project-references-only — do not add files there.

## Testing

- Runner: **Vitest** (Vite-native, shares `vite.config.ts`)
- Test files: `*.test.ts` only (no `.tsx` test files)
- Test environment: `node` (not jsdom — DOM APIs are not available in tests)
- Each test file imports from `vitest` explicitly: `import { describe, test, expect, vi } from 'vitest'`

## Code style (ESLint enforced)

- **4-space indentation**, **semicolons required**
- Unused vars: allowed if prefixed with `_`
- `@typescript-eslint/no-explicit-any` is off in test files

## Build output

- `dist/` — single self-contained HTML file; pre-built artifact may exist but is gitignored
- `vite-plugin-singlefile` inlines all JS/CSS into `index.html`

## Source layout

```
src/
  main.tsx          # entry
  App.tsx
  communication/    # cross-tab event bus (BroadcastChannel-based)
  model/
    event/          # Event types
    identifier/     # AppId
    slides/         # Slide, SlideShow, Image models
    JsonUtils.ts
```
