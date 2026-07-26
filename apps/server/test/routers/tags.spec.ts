import { call } from "@orpc/server"
import { tagsRouter } from "server/routers/tags"
import { describe, expect, test } from "vite-plus/test"

describe("tags router", () => {
  test("exports five procedures with flat RPC paths", () => {
    const keys = Object.keys(tagsRouter).sort()
    expect(keys).toEqual(
      ["tagCreate", "tagDelete", "tagById", "tagList", "tagUpdate"].sort(),
    )
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(tagsRouter)) {
      expect(procedure).toBeDefined()
    }
  })

  test("admin procedures reject null sessions with FORBIDDEN", async () => {
    await expect(
      call(tagsRouter.tagCreate, { name: "x" }, { context: { session: null } }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})
