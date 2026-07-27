import type { SessionUser } from "server/auth"

import { call } from "@orpc/server"
import { adminRouter } from "server/routers/admin"
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

  test("admin procedures reject null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(adminRouter.admin.apiKeyList, undefined, {
        context: { session: null },
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("admin procedures reject non-admin sessions with FORBIDDEN", async () => {
    await expect(
      call(adminRouter.admin.apiKeyList, undefined, {
        context: userContext("user"),
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})
