import type { SessionUser } from "server/auth"

import { call } from "@orpc/server"
import { userRouter } from "server/routers/user"
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

describe("user router", () => {
  test("exports nine procedures nested under user", () => {
    const keys = Object.keys(userRouter.user).sort()
    expect(keys).toEqual(
      [
        "apiKeyCreate",
        "apiKeyDelete",
        "apiKeyList",
        "apiKeyStats",
        "apiKeyUpdate",
        "me",
        "runs",
        "stats",
        "update",
      ].sort(),
    )
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(userRouter.user)) {
      expect(procedure).toBeDefined()
    }
  })

  test("protected procedures reject null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(userRouter.user.me, undefined, { context: { session: null } }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("user.me returns the trimmed session for authenticated users", async () => {
    const result = await call(userRouter.user.me, undefined, {
      context: userContext(),
    })
    expect(result).toEqual({
      id: "u_1",
      email: "u@example.com",
      name: null,
      username: "u",
      image: null,
    })
  })

  test("admin procedures reject null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(userRouter.user.apiKeyList, undefined, {
        context: { session: null },
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("admin procedures reject non-admin sessions with FORBIDDEN", async () => {
    await expect(
      call(userRouter.user.apiKeyList, undefined, {
        context: userContext("user"),
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})
