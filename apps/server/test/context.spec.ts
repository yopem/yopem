import type { AppContext } from "server/context"

import { describe, expect, test } from "vite-plus/test"

describe("AppContext type", () => {
  test("accepts a context with null session", () => {
    const ctx: AppContext = { Variables: { session: null } }
    expect(ctx.Variables.session).toBeNull()
  })
})
