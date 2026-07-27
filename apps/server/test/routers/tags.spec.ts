import { call } from "@orpc/server"
import { tagsRouter } from "server/routers/tags"
import { describe, expect, test } from "vite-plus/test"

describe("tags router", () => {
  test("exports five procedures nested under tags", () => {
    const keys = Object.keys(tagsRouter.tags).sort()
    expect(keys).toEqual(["byId", "create", "delete", "list", "update"].sort())
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(tagsRouter.tags)) {
      expect(procedure).toBeDefined()
    }
  })

  test("admin procedures reject null sessions with FORBIDDEN", async () => {
    await expect(
      call(
        tagsRouter.tags.create,
        { name: "x" },
        { context: { session: null } },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})
