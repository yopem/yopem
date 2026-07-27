import { call } from "@orpc/server"
import { categoriesRouter } from "server/routers/categories"
import { describe, expect, test } from "vite-plus/test"

describe("categories router", () => {
  test("exports five procedures nested under categories", () => {
    const keys = Object.keys(categoriesRouter.categories).sort()
    expect(keys).toEqual(["byId", "create", "delete", "list", "update"].sort())
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(categoriesRouter.categories)) {
      expect(procedure).toBeDefined()
    }
  })

  test("admin procedures reject null sessions with FORBIDDEN", async () => {
    await expect(
      call(
        categoriesRouter.categories.create,
        { name: "x" },
        { context: { session: null } },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})
