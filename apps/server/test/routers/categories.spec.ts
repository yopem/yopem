import { call } from "@orpc/server"
import { categoriesRouter } from "server/routers/categories"
import { describe, expect, test } from "vite-plus/test"

describe("categories router", () => {
  test("exports five procedures with flat RPC paths", () => {
    const keys = Object.keys(categoriesRouter).sort()
    expect(keys).toEqual(
      [
        "categoryCreate",
        "categoryDelete",
        "categoryById",
        "categoryList",
        "categoryUpdate",
      ].sort(),
    )
  })

  test("every procedure is defined", () => {
    for (const procedure of Object.values(categoriesRouter)) {
      expect(procedure).toBeDefined()
    }
  })

  test("admin procedures reject null sessions with FORBIDDEN", async () => {
    await expect(
      call(
        categoriesRouter.categoryCreate,
        { name: "x" },
        { context: { session: null } },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })
})
