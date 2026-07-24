<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project uses Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, and Oxfmt. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite — use `vp`, not `vite` or `npm`.

Docs: `node_modules/vite-plus/docs` or https://viteplus.dev/guide/

## Review Checklist

- [ ] Run `vp install` after pulling remote changes.
- [ ] Run `vp check` and `vp test` to format, lint, type check, and test changes.

<!--VITE PLUS END-->

## Stack

- **Package manager:** pnpm 10.12.1 (workspaces, `catalog:` deps)
- **Runtime:** Node.js (Docker: `node:24-alpine`), ESM (`"type": "module"`)
- **Language:** TypeScript 7
- **Frontend:** React 19, TanStack Start (SSR), TanStack Router (file-based), TanStack React Query, TanStack React Form
- **Styling:** Tailwind CSS 4, Base UI (`@base-ui/react`) primitives, coss ui components from shadcn/ui registry, `tw-animate-css`, `next-themes`
- **Backend:** Hono, oRPC (`@orpc/server` + `@orpc/client` + TanStack Query bindings)
- **DB:** PostgreSQL + Drizzle ORM (`drizzle-kit`), `pg` Pool (max 20)
- **Auth:** OpenAuth (`@openauthjs/openauth`), cookie-based sessions
- **Cache:** Redis (`ioredis`)
- **Storage:** Cloudflare R2 (S3-compatible, `@aws-sdk/client-s3`)
- **Payments:** Polar.sh (`@polar-sh/hono`)
- **AI:** Vercel AI SDK + OpenAI / OpenRouter, `sharp` for media processing
- **Validation:** Zod 4
- **Env:** `@t3-oss/env-core`, `dotenv-cli`

## Monorepo layout

```
apps/
  web/       — public TanStack Start app (port 3000)
  admin/     — admin TanStack Start app (port 3001)
  server/    — Hono API server, built with Vite (`@hono/vite-build`)
packages/
  db/        — Drizzle schema, migrations, services (data-access layer)
  auth/      — OpenAuth client + subjects
  rpc/       — oRPC shared/client/server, query bindings, query hydration (`hydration.tsx`) and server prefetching (`prefetch.ts`)
  ui/        — coss ui components from shadcn/ui registry (Base UI), theme, style.css
  utils/     — crypto, custom-id, date formatting, validation schemas
  env/       — t3-env validated env vars (server + client)
```

### Server app structure (`apps/server/src`)

- `index.ts` — Hono app: CORS (WEB_ORIGIN + ADMIN_ORIGIN), `authMiddleware`, mounts routes.
- `root.ts` — `appRouter` aggregating procedures (admin, assets, categories, products, session, tags, user).
- `orpc.ts` — `publicProcedure` / `protectedProcedure` / `adminProcedure` (role check), `createRPCContext` (session from cookies, db, redis).
- `handlers/` — `rpc.ts` (prefix `/rpc`), `auth-callback.ts` (OAuth code exchange + redirect validation), `checkout.ts`, `portal.ts`, `webhooks.ts` (Polar).
- `cache/` — moved to `packages/cache`; Redis-backed cache (`ioredis`) with `invalidatePattern`, used via the `cache` workspace package.
- `storage/` — `R2Storage` (singleton) using `sharp` for image→webp and magic-byte validation.
- `llm/` — `executeAITool`, providers (`openai`, `openrouter`), media uploaded to R2.
- `payments/` — 17 modules: plans, credits, entitlements, quota, subscription/webhook handling, usage tracking/alerts. Product entity (`apps/server/src/procedures/products.ts`) replaces the old `tools` entity across DB schema, components, and routes.

## Commands

```sh
vp install                          # install deps
vp check                            # format + lint + typecheck
vp test                             # run tests

# Dev
vp run -r --parallel dev            # all apps
vp run --filter web dev             # web only
vp run --filter admin dev           # admin only
vp run --filter server dev          # server only (Vite dev server via @hono/vite-dev-server)

# Build
vp run -r build                     # all
vp build apps/web                   # web (Vite)
vp build apps/admin                 # admin (Vite)
vp run --filter server build        # server (Vite + @hono/vite-build)

# DB
vp run --filter db db:generate      # drizzle-kit generate
vp run --filter db db:migrate       # drizzle-kit migrate
vp run --filter db db:seed          # seed categories, tags, and products
vp run --filter db db:studio        # drizzle-kit studio

# Lint / format
vp lint                             # lint all
vp lint --fix                       # lint + auto-fix
vp fmt --check .                    # format check
vp fmt --write .                    # format write
vp run -r typecheck                 # tsc --noEmit across all packages
```

## Environment

- `.env` at repo root (not committed). Must exist for most commands.
- `APP_ENV=development` for local dev.
- `PUBLIC_` and `VITE_` prefixed vars are exposed to the client.
- Env validation (`@t3-oss/env-core`) is **skipped** in CI and during the `lint` npm lifecycle event (`skipValidation`).
- **Ports:** server `4000` (`SERVER_PORT`), web `3000` (`WEB_PORT`), admin `3001` (`ADMIN_PORT`).
- **Auth:** OpenAuth issuer is `AUTH_ISSUER`. Session cookies: `access_token` (1d) + `refresh_token` (7d), `httpOnly`, `sameSite: none` (prod) / `lax` (dev), secure if `COOKIE_DOMAIN` set or prod.
- `vp run with-env` wraps a command with `dotenv -e ../../.env --`; required for server/db/build scripts.

## Conventions

- **No relative parent imports** (`import/no-relative-parent-imports: error`). Use workspace package names or path aliases.
- **Web `@/` alias** resolves to `apps/web/src` (and similar for admin); prefer it for app-local imports, workspace names for packages.
- **Separate type imports** (`import type { X } from "..."`).
- **No `console.log`** — only `console.error`, `console.warn`, `console.info`.
- **No semicolons**, double quotes, 80-char width, trailing commas.
- **Import order:** type-imports → external → workspace types → workspace values → internal → parent/sibling/index.
- **`no-explicit-any: error`**, **`no-unused-vars`** (prefix with `_` to ignore), **`require-await: error`**, **`prefer-const: error`**.
- **No comments or JSDoc** — code must be self-documenting through clear naming and structure.
- **Components and functions** must be reusable, maintainable, modular, and easy to understand.
- **Icons:** use `lucide-react` only. Imports use the `Icon` suffix convention (e.g. `BoldIcon`, `LinkIcon`, `TrashIcon`, `GripVerticalIcon`, not `Bold`, `Link`, `Trash`, `GripVertical`). Tabler/icons-react and any other icon library are not used.
- **Commit granularity:** one commit per feature, change, or context switch.
- **Keep `AGENTS.md` current** — update it when the tech stack, frameworks, or packages change.
- **`routeTree.gen.ts`** is generated by TanStack Router and gitignored.
- **`.tanstack/`** directory is gitignored (TanStack Router/Start cache).
- **Data access** lives in `packages/db/src/services/` — never write SQL from apps; go through services. Generate IDs with `packages/utils` `createCustomId`.
- **Server-only logic in web/admin** (auth, session) must use `createServerFn` (server-only). Client components need `"use client"`.

## Gotchas

- Server is built with **Vite** (`@hono/vite-build/node`), output to `apps/server/dist/index.js`. Web/admin also use Vite + TanStack Start.
- A patched `@tanstack/start-plugin-core@1.171.19` exists in `patches/`. Run `vp install` after pulling to apply it.
- `vp run with-env` loads `.env` from repo root — required for server, db, and build commands.
- Docker builds set `CI=true` and require `PUBLIC_` ARGs. Web/admin build output is `dist/{client,server}`; the `start` script runs `srvx` serving `dist/server/server.js` with `dist/client` as static assets (web on `WEB_PORT` default 3000, admin on `ADMIN_PORT` default 3001). The Dockerfile `CMD` is `node node_modules/srvx/bin/srvx.mjs serve --prod ... -s ../client dist/server/server.js`.
- `AGENTS.md` is gitignored — edits won't show as uncommitted changes.
- **Query hydration:** web/admin `__root.tsx` uses `dehydrate(queryClient)` + `<HydrateClient state=...>` from `@yopem/rpc/hydration` to transfer server-prefetched data to the client. Server routes prefetch via `prefetchQueries` from `@yopem/rpc/prefetch` and pass the dehydrated state into the root before render.
