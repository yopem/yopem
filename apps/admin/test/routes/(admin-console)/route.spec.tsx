import { describe, expect, test } from "vite-plus/test"

import type { SessionUser } from "auth/types"

import { Route } from "@/routes/(admin-console)/route"

interface GuardContext {
  context: { session: SessionUser | null }
}

const session = (role: SessionUser["role"] = "admin"): SessionUser => ({
  id: "u_1",
  email: "admin@example.com",
  name: "Admin",
  username: "admin",
  image: null,
  role,
})

const beforeLoad = Route.options.beforeLoad as unknown as (
  opts: GuardContext,
) => Promise<{ session: SessionUser }>

const redirectOptionsOf = async (fn: () => unknown) => {
  try {
    await fn()
  } catch (err) {
    const maybeResponse = err as Response & { options?: { to?: string } }
    if (maybeResponse?.options?.to) {
      return maybeResponse.options.to
    }
    throw err
  }
  throw new Error("expected beforeLoad to throw, but it did not")
}

describe("admin-console layout route", () => {
  test("registers a session guard via beforeLoad", () => {
    expect(Route).toBeDefined()
    expect(typeof Route.options.beforeLoad).toBe("function")
    expect(typeof Route.options.component).toBe("function")
  })

  test("redirects unauthenticated users to login", async () => {
    const to = await redirectOptionsOf(() =>
      beforeLoad({ context: { session: null } }),
    )
    expect(to).toBe("/auth/login")
  })

  test("redirects non-admin users to forbidden", async () => {
    const to = await redirectOptionsOf(() =>
      beforeLoad({ context: { session: session("user") } }),
    )
    expect(to).toBe("/forbidden")
  })

  test("admits admin users and returns session on context", async () => {
    const result = await beforeLoad({ context: { session: session("admin") } })
    expect(result.session.role).toBe("admin")
  })
})
