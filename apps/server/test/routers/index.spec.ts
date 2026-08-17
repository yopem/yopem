import { describe, expect, test } from "bun:test"
import { router } from "server/routers"

describe("router composition", () => {
  test("exports a router object", () => {
    expect(router).toBeDefined()
    expect(typeof router).toBe("object")
  })

  test("composes each domain router as a top-level key", () => {
    expect(router).toHaveProperty("admin")
    expect(router).toHaveProperty("assets")
    expect(router).toHaveProperty("categories")
    expect(router).toHaveProperty("products")
    expect(router).toHaveProperty("session")
    expect(router).toHaveProperty("tags")
    expect(router).toHaveProperty("user")
  })

  test("includes the categories procedures nested under categories", () => {
    expect(router.categories).toHaveProperty("list")
    expect(router.categories).toHaveProperty("create")
    expect(router.categories).toHaveProperty("byId")
    expect(router.categories).toHaveProperty("update")
    expect(router.categories).toHaveProperty("delete")
  })
})
