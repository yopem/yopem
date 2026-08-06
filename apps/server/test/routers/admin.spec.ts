import type { SessionUser } from "server/auth"

import { call } from "@orpc/server"
import { describe, expect, test } from "bun:test"
import { adminRouter } from "server/routers/admin"

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

const adminContext = (): { session: SessionUser } => ({
  session: {
    id: "u_1",
    email: "u@example.com",
    name: null,
    username: "u",
    image: null,
    role: "admin",
  },
})

describe("admin router", () => {
  test("exports thirteen procedures nested under admin", () => {
    const keys = Object.keys(adminRouter.admin).sort()
    expect(keys).toEqual(
      [
        "activity",
        "aiRequestsHistory",
        "apiKeyCreate",
        "apiKeyDelete",
        "apiKeyList",
        "apiKeyStats",
        "apiKeyUpdate",
        "assetSettingsGet",
        "assetSettingsUpdate",
        "modelCreate",
        "modelDelete",
        "modelList",
        "modelUpdate",
      ].sort(),
    )
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(adminRouter.admin)) {
      expect(procedure).toBeDefined()
    }
  })

  test("admin procedures reject null sessions with UNAUTHORIZED", () => {
    expect(
      call(adminRouter.admin.apiKeyList, undefined, {
        context: { session: null },
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("admin procedures reject non-admin sessions with FORBIDDEN", () => {
    expect(
      call(adminRouter.admin.apiKeyList, undefined, {
        context: userContext("user"),
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })

  test("modelCreate rejects an invalid provider with BAD_REQUEST", () => {
    expect(
      call(
        adminRouter.admin.modelCreate,
        {
          provider: "invalid-provider" as "openai",
          modelId: "x",
          displayName: "X",
          isEnabled: true,
        },
        { context: adminContext() },
      ),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })
  })
})
