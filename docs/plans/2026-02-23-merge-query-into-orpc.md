# Merge @repo/query into @repo/orpc Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Absorb all files from `packages/query` into `packages/orpc`, delete `packages/query`, and rewire the two consumers (`apps/web` and `apps/admin`) so nothing breaks.

**Architecture:** Move the 4 source files from `packages/query/src/` into `packages/orpc/src/`, add missing dependencies to `packages/orpc/package.json`, expose the new exports there, remove `@repo/query` from the two apps' `package.json`, update the two `providers.tsx` import sites, then delete `packages/query`.

**Tech Stack:** TypeScript, React, TanStack Query, oRPC (`@orpc/client`, `@orpc/tanstack-query`), Bun workspaces, Turborepo

---

### Task 1: Copy source files from packages/query into packages/orpc

**Files:**
- Copy: `packages/query/src/serializer.tsx` → `packages/orpc/src/serializer.tsx`
- Copy: `packages/query/src/client.tsx` → `packages/orpc/src/query-client.tsx`
- Copy: `packages/query/src/provider.tsx` → `packages/orpc/src/provider.tsx`
- Copy: `packages/query/src/hydration.tsx` → `packages/orpc/src/hydration.tsx`

**Step 1: Copy the four files**

```bash
cp packages/query/src/serializer.tsx packages/orpc/src/serializer.tsx
cp packages/query/src/client.tsx packages/orpc/src/query-client.tsx
cp packages/query/src/provider.tsx packages/orpc/src/provider.tsx
cp packages/query/src/hydration.tsx packages/orpc/src/hydration.tsx
```

Note: `client.tsx` is renamed to `query-client.tsx` to avoid clashing with the existing `packages/orpc/src/client.ts` (which exports `clientApi`).

**Step 2: Fix the internal import in `query-client.tsx`**

`packages/query/src/client.tsx` imports `./serializer` — that path is still valid after the rename (both files are now in the same directory), so no change needed.

**Step 3: Fix the internal import in `provider.tsx`**

`packages/query/src/provider.tsx` imports `./client` — update it to `./query-client` since the file was renamed.

Edit `packages/orpc/src/provider.tsx`:
```tsx
// change
import { createQueryClient } from "./client"
// to
import { createQueryClient } from "./query-client"
```

**Step 4: Fix the internal import in `hydration.tsx`**

Edit `packages/orpc/src/hydration.tsx`:
```tsx
// change
import { createQueryClient } from "./client"
// to
import { createQueryClient } from "./query-client"
```

---

### Task 2: Update packages/orpc/package.json

**Files:**
- Modify: `packages/orpc/package.json`

**Step 1: Add missing dependencies**

`@repo/query` depended on `@tanstack/react-query` and `react`. `@repo/orpc` already has `@orpc/tanstack-query` but not the React packages. Add them to `dependencies`:

```json
"@tanstack/react-query": "catalog:",
"react": "catalog:"
```

**Step 2: Add new exports**

Add these four entries to the `"exports"` map:

```json
"./serializer": {
  "types": "./src/serializer.tsx",
  "default": "./src/serializer.tsx"
},
"./query-client": {
  "types": "./src/query-client.tsx",
  "default": "./src/query-client.tsx"
},
"./provider": {
  "types": "./src/provider.tsx",
  "default": "./src/provider.tsx"
},
"./hydration": {
  "types": "./src/hydration.tsx",
  "default": "./src/hydration.tsx"
}
```

---

### Task 3: Update apps/web

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/components/providers.tsx:3`

**Step 1: Remove @repo/query dependency**

In `apps/web/package.json`, delete the line:
```json
"@repo/query": "workspace:*",
```

**Step 2: Update the import in providers.tsx**

Edit `apps/web/src/components/providers.tsx`:
```tsx
// change
import { QueryProvider } from "@repo/query/provider"
// to
import { QueryProvider } from "@repo/orpc/provider"
```

---

### Task 4: Update apps/admin

**Files:**
- Modify: `apps/admin/package.json`
- Modify: `apps/admin/src/components/providers.tsx:3`

**Step 1: Remove @repo/query dependency**

In `apps/admin/package.json`, delete the line:
```json
"@repo/query": "workspace:*",
```

**Step 2: Update the import in providers.tsx**

Edit `apps/admin/src/components/providers.tsx`:
```tsx
// change
import { QueryProvider } from "@repo/query/provider"
// to
import { QueryProvider } from "@repo/orpc/provider"
```

---

### Task 5: Delete packages/query

**Files:**
- Delete: `packages/query/` (entire directory)

**Step 1: Remove the directory**

```bash
rm -rf packages/query
```

---

### Task 6: Run bun install to update lockfile

**Step 1:**

```bash
bun install
```

Expected: lockfile updated, no errors about missing packages.

---

### Task 7: Verify — typecheck, lint, smoke test

**Step 1: Typecheck**

```bash
bun run typecheck
```

Expected: `Tasks: 15 successful, 15 total` (one fewer package now that @repo/query is gone).

**Step 2: Lint**

```bash
bun run lint
```

Expected: all packages pass, 0 errors.

**Step 3: Smoke test**

```bash
curl -s -X POST http://localhost:4000/rpc/health \
  -H 'Content-Type: application/json' \
  -d '{"json":null}'
```

Expected: `{"json":"ok"}`

---

### Task 8: Commit

**Step 1:**

```bash
git add -A
git commit -m "refactor: merge @repo/query into @repo/orpc, delete packages/query"
```
