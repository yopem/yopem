import type { SessionUser } from "server/auth"

import { call } from "@orpc/server"
import { assetsRouter } from "server/routers/assets"
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

describe("assets router", () => {
  test("exports four procedures with flat RPC paths", () => {
    const keys = Object.keys(assetsRouter).sort()
    expect(keys).toEqual(
      ["assetDelete", "assetList", "assetUpload", "assetUploadSettings"].sort(),
    )
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(assetsRouter)) {
      expect(procedure).toBeDefined()
    }
  })

  test("assetUploadSettings is registered (public, no auth)", () => {
    expect(assetsRouter.assetUploadSettings).toBeDefined()
  })

  test("assetList rejects null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(
        assetsRouter.assetList,
        {},
        {
          context: { session: null },
        },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("assetUpload rejects null sessions with UNAUTHORIZED", async () => {
    await expect(
      call(
        assetsRouter.assetUpload,
        new File(["x"], "test.txt", { type: "text/plain" }),
        { context: { session: null } },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("assetUpload rejects non-admin sessions with FORBIDDEN", async () => {
    await expect(
      call(
        assetsRouter.assetUpload,
        new File(["x"], "test.txt", { type: "text/plain" }),
        { context: userContext("user") },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })

  test("assetDelete rejects non-admin sessions with FORBIDDEN", async () => {
    await expect(
      call(
        assetsRouter.assetDelete,
        { id: "ast_1" },
        {
          context: userContext("user"),
        },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})
