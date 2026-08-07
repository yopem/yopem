import type { SessionUser } from "server/auth"

import { call } from "@orpc/server"
import { describe, expect, test } from "bun:test"
import { assetsRouter } from "server/routers/assets"

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
  test("exports five procedures nested under assets", () => {
    const keys = Object.keys(assetsRouter.assets).sort()
    expect(keys).toEqual(
      ["bulkDelete", "delete", "list", "upload", "uploadSettings"].sort(),
    )
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(assetsRouter.assets)) {
      expect(procedure).toBeDefined()
    }
  })

  test("assets.uploadSettings is registered (public, no auth)", () => {
    expect(assetsRouter.assets.uploadSettings).toBeDefined()
  })

  test("assets.list rejects null sessions with UNAUTHORIZED", () => {
    expect(
      call(
        assetsRouter.assets.list,
        {},
        {
          context: { session: null },
        },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("assets.upload rejects null sessions with UNAUTHORIZED", () => {
    expect(
      call(
        assetsRouter.assets.upload,
        new File(["x"], "test.txt", { type: "text/plain" }),
        { context: { session: null } },
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" })
  })

  test("assets.upload rejects non-admin sessions with FORBIDDEN", () => {
    expect(
      call(
        assetsRouter.assets.upload,
        new File(["x"], "test.txt", { type: "text/plain" }),
        { context: userContext("user") },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })

  test("assets.delete rejects non-admin sessions with FORBIDDEN", () => {
    expect(
      call(
        assetsRouter.assets.delete,
        { id: "ast_1" },
        {
          context: userContext("user"),
        },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})
