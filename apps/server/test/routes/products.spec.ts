import * as mod from "server/routes/products"
import { describe, expect, test } from "vitest"

describe("products routes", () => {
  test("exports Hono apps", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
    for (const exported of Object.values(mod)) {
      expect(exported).toBeDefined()
    }
  })
})
