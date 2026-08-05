<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project uses Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, and Oxfmt. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite — use `vp`, not `vite` or `npm`.

Docs: `node_modules/vite-plus/docs` or https://viteplus.dev/guide/

## Review Checklist

- [ ] Run `vp install` after pulling remote changes.
- [ ] Run `vp check` and `vp test` to format, lint, type check, and test changes.

<!--VITE PLUS END-->

## Agent workflow

- Before starting work, query codebase memory via available MCP first to check prior decisions, plans, blockers, and relevant context.

## Stack

- **Package manager:** pnpm 11.17.0 (workspaces, `catalog:` deps)
- **Runtime:** Node.js (Docker: `node:24-alpine`), ESM (`"type": "module"`)
- **Language:** TypeScript 7
- **Frontend:** React 19, TanStack Start (SSR), TanStack Router (file-based), TanStack React Query, TanStack React Form
- **Styling:** Tailwind CSS 4, Base UI (`@base-ui/react`) primitives, coss ui components from shadcn/ui registry, `tw-animate-css`, `next-themes`
- **Backend:** Hono + oRPC (`@orpc/server`, `@orpc/openapi` for auto-generated docs at `/rpc/doc`), cookie-based auth middleware
- **DB:** PostgreSQL + Drizzle ORM (`drizzle-kit`), `pg` Pool (max 20)
- **Auth:** OpenAuth (`@openauthjs/openauth`), cookie-based sessions
- **Cache:** Redis (`ioredis`)
- **Storage:** Cloudflare R2 (S3-compatible, `@aws-sdk/client-s3`)
- **AI:** Vercel AI SDK + OpenAI / OpenRouter, `sharp` for media processing
- **Validation:** Valibot 1 (via `import * as v from "valibot"`; drizzle schemas via `drizzle-valibot`)
- **Env:** `dotenv-cli`

## Monorepo layout

```
apps/
  web/       — public TanStack Start app (port 3000)
  admin/     — admin TanStack Start app (port 3001)
  server/    — Hono API server, built with Vite (`@hono/vite-build`)
packages/
  db/        — Drizzle schema, migrations, services (data-access layer)
  auth/      — OpenAuth client + subjects
  rpc/       — oRPC typed client (`@orpc/client`) + TanStack Query bindings (`@orpc/tanstack-query`), shared between web/admin apps
  ui/        — coss ui components from shadcn/ui registry (Base UI), theme, style.css
  utils/     — crypto, custom-id, date formatting, validation schemas
  env/       — typed env helpers (server + client)
```

### Server app structure (`apps/server/src`)

- `index.ts` — Hono app: CORS (WEB_ORIGIN + ADMIN_ORIGIN), `authMiddleware`, mounts `/auth` callback route, oRPC handler under `/rpc`, generic `onError`.
- `routers/` — oRPC procedures (flat RPC-style, e.g. `/category/list`), one file per domain (admin, assets, categories, products, session, tags, user) mirroring `db/services/`, composed in `routers/index.ts`.
- `routers/orpc.ts` — `os` builder bound to `{ session }` context, `requireAuth` / `requireAdmin` middlewares.
- oRPC mounted under `/rpc` via `OpenAPIHandler` + Proxy body-parsing bridge in `index.ts`. Docs at `/rpc/doc`, spec at `/rpc/spec.json`.
- `handlers/` — `auth-callback.ts` (OAuth code exchange + redirect validation).
- `storage/` — `R2Storage` (singleton) using `sharp` for image→webp and magic-byte validation.
- `llm/` — `executeAITool`, providers (`openai`, `openrouter`), media uploaded to R2.

## Commands

```sh
vp install                          # install deps
vp check                            # format + lint + typecheck
vp test                             # run tests

# Dev
vp run -r --parallel dev            # all apps
vp run --filter server dev          # server only (Vite dev server via @hono/vite-dev-server)

# Build
vp run -r build                     # all
vp run --filter server build        # server (Vite + @hono/vite-build)

# DB
vp run --filter db db:generate      # drizzle-kit generate
vp run --filter db db:migrate       # drizzle-kit migrate
vp run --filter server seed       # seed categories, tags, and products
vp run --filter db db:studio        # drizzle-kit studio

# Lint / format
vp lint                             # lint all
vp lint --fix                       # lint + auto-fix
vp fmt --check .                    # format check
vp fmt --write .                    # format write
vp run -r typecheck                 # tsc --noEmit across all packages
```

## Testing

- **Test runner:** always use `vp test` (runs Vitest via Vite+). Never run `npx vitest` or `vitest` directly — `vp test` is the only entry point.
- **Run a single project:** `vp test -- --project <name>` (e.g. `--project db`, `--project server`, `--project ui`).
- **Config lives in `vite.config.ts`** — there are no standalone `vitest.config.ts` files. Test options (projects, aliases, environment, plugins) are configured under the `test` key of each package's `vite.config.ts`, using `defineConfig` from `vite-plus`.
- **Allowed test libraries:** Vitest and Playwright only. Do not add other test frameworks.
- **Import source in tests:** always `import { describe, expect, test, vi, ... } from "vite-plus/test"` — never from `"vitest"`. `vite-plus/test` re-exports everything from vitest.
- **Test location:** every `.ts`/`.tsx` source file under any `src/` dir has a matching `.spec.ts` (or `.spec.tsx`) in a sibling `test/` dir mirroring the `src/` structure (e.g. `packages/utils/src/custom-id.ts` → `packages/utils/test/custom-id.spec.ts`). Non-code files (`.css`, `.json`, `.sql`, `.woff2`) are not tested.
- **Imports in tests:** use workspace package-name imports (e.g. `import { createCustomId } from "utils/custom-id"`), not relative parent imports. The per-package `vite.config.ts` alias maps the package name to `./src`.
- **Per-project env:** server tests need env vars set at import time; these come from `apps/server/test/setup.ts` (a Vitest `globalSetup` exporting a default function) — do not rely on `.env` for the test run.

## Environment

- `.env` at repo root (not committed). Must exist for most commands.
- `APP_ENV=development` for local dev.
- `PUBLIC_` and `VITE_` prefixed vars are exposed to the client.
- Env validation is **skipped** in CI and during the `lint` npm lifecycle event.
- **Ports:** server `4000` (`SERVER_PORT`), web `3000` (`WEB_PORT`), admin `3001` (`ADMIN_PORT`).
- **Auth:** OpenAuth issuer is `AUTH_ISSUER`. Session cookies: `access_token` (1d) + `refresh_token` (7d), `httpOnly`, `sameSite: none` (prod) / `lax` (dev), secure if `COOKIE_DOMAIN` set or prod.
- `vp run with-env` wraps a command with `dotenv -e ../../.env --`; required for server/db/build scripts.

## Conventions

- **No relative parent imports** (`import/no-relative-parent-imports: error`). Use workspace package names or path aliases.
- **Web `@/` alias** resolves to `apps/web/src` (and similar for admin); prefer it for app-local imports, workspace names for packages.
- **Separate type imports** (`import type { X } from "..."`).
- **No `console.log`** — only `console.error`, `console.warn`, `console.info`.
- **Separate type imports** (`import type { X } from "..."`).
- **No `await import()`** — use static `import` always. If lazy loading is genuinely needed, inline the pattern directly in the codebase; don't write ad-hoc `await import()` calls.
- **No semicolons**, double quotes, 80-char width, trailing commas.
- **TanStack Query via oRPC** — every query and mutation must be wrapped in the generated `queryOptions` / `mutationOptions`:
  - Queries: `useQuery(queryApi.admin.apiKeyList.queryOptions())` — use flat, never spread (`...queryOptions()`) except when extending/overriding.
  - Mutations: `useMutation(queryApi.products.create.mutationOptions({ onSuccess, onError }))` — never write a custom `mutationFn`.
  - Never call the client directly (`.call(...)`); pass the typed input straight to `.mutate(...)`.
- **TanStack React Form** — all forms must be built with `@tanstack/react-form` `useForm` and validated with Valibot `validators`. Required/not-empty fields use `onBlur` + `onSubmit` validators (never `onChange`/`onMount`) so empty-pristine fields show no error until the user leaves the field or submits.
- **Import order:** type-imports → external → workspace types → workspace values → internal → parent/sibling/index.
- **`no-explicit-any: error`**, **`no-unused-vars`** (prefix with `_` to ignore), **`require-await: error`**, **`prefer-const: error`**.
- **No comments or JSDoc** — code must be self-documenting through clear naming and structure.
- **Components and functions** must be reusable, maintainable, modular, and easy to understand.
- **Omit file extensions in imports:** never add `.ts`, `.tsx`, `.js`, `.jsx` extensions when importing from other files — let the bundler/resolver handle them.
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
- Server routes are organized as oRPC routers (one file per domain in `apps/server/src/routers/`), mounted under `/rpc` via `OpenAPIHandler`. The API is exposed under `/rpc/{domain}/{action}` (flat RPC-style) and auto-documented at `/rpc/doc`. Auth/role checks are oRPC middlewares (`requireAuth`, `requireAdmin`) in `routers/orpc.ts`.
