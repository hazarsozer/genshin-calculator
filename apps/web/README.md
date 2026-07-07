# Genshin Damage Calculator — Web UI

A Next.js static-export web app built on the `@genshin/core` oracle-gated engine.

## Quick Start

```bash
# 1. Install all workspace dependencies (run from repo root)
pnpm install

# 2. Start the dev server
pnpm --filter web dev
# → http://localhost:3000

# 3. Run unit tests (Vitest)
pnpm --filter web test

# 4. Run E2E tests (Playwright)
pnpm --filter web exec playwright test
```

## Build

```bash
pnpm --filter web build
# → produces a static export in apps/web/out/
```

## TypeScript Check

```bash
pnpm --filter web typecheck
```

## Deploy

The first deploy must be run **manually** by the human:

```bash
cd apps/web
vercel
```

Subsequent deploys are automatic via Vercel's Git integration once the project is linked.

`vercel.json` sets `framework: "nextjs"` so Vercel detects the static export automatically.
