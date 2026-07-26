import * as mod from "server/routes/tags"
import { describe, expect, test } from "vitest"

describe("tags routes", () => {
  test("exports Hono apps", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
    for (const exported of Object.values(mod)) {
      expect(exported).toBeDefined()
    }
  })
})
