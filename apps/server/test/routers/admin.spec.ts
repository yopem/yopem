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
  test("exports thirteen procedures with flat RPC paths", () => {
    const keys = Object.keys(adminRouter).sort()
    expect(keys).toEqual(
      [
        "adminActivity",
        "adminAiRequestsHistory",
        "adminApiKeyCreate",
        "adminApiKeyDelete",
        "adminApiKeyList",
        "adminApiKeyStats",
        "adminApiKeyUpdate",
        "adminAssetSettingsGet",
        "adminAssetSettingsUpdate",
        "adminModelCreate",
        "adminModelDelete",
        "adminModelList",
        "adminModelUpdate",
      ].sort(),
    )
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(adminRouter)) {
      expect(procedure).toBeDefined()
    }
  })

  test("admin procedures reject null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(adminRouter.adminApiKeyList, undefined, {
        context: { session: null },
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("admin procedures reject non-admin sessions with FORBIDDEN", async () => {
    await expect(
      call(adminRouter.adminApiKeyList, undefined, {
        context: userContext("user"),
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})
