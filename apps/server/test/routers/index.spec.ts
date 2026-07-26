import { router } from "server/routers"
import { describe, expect, test } from "vite-plus/test"

describe("router composition", () => {
  test("exports a router object", () => {
    expect(router).toBeDefined()
    expect(typeof router).toBe("object")
  })

  test("includes the categories router", () => {
    expect(router).toHaveProperty("categoryList")
    expect(router).toHaveProperty("categoryCreate")
    expect(router).toHaveProperty("categoryById")
    expect(router).toHaveProperty("categoryUpdate")
    expect(router).toHaveProperty("categoryDelete")
  })
})
