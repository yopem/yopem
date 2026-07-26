import type { SessionUser } from "server/auth"

import { call } from "@orpc/server"
import { sessionRouter } from "server/routers/session"
import { describe, expect, test } from "vite-plus/test"

const userContext = (
  role: SessionUser["role"] = "user",
): { session: SessionUser } => ({
  session: {
    id: "u_1",
    email: "u@example.com",
    name: null,
    username: "u",
    image: null,
    role,
  },
})

describe("session router", () => {
  test("exports a sessionMe procedure", () => {
    expect(sessionRouter.sessionMe).toBeDefined()
  })

  test("sessionMe returns the session from context for authenticated users", async () => {
    const result = await call(sessionRouter.sessionMe, undefined, {
      context: userContext(),
    })
    expect(result).toEqual(userContext().session)
  })

  test("sessionMe rejects null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(sessionRouter.sessionMe, undefined, { context: { session: null } }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })
})
