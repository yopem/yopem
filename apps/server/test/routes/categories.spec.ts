import * as mod from "server/routes/categories"
import { describe, expect, test } from "vite-plus/test"

describe("categories routes", () => {
  test("exports Hono apps", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
    for (const exported of Object.values(mod)) {
      expect(exported).toBeDefined()
    }
  })
})
