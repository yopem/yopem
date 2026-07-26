import * as mod from "server/routes/assets"
import { describe, expect, test } from "vitest"

describe("assets routes", () => {
  test("exports Hono apps", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
    for (const exported of Object.values(mod)) {
      expect(exported).toBeDefined()
    }
  })
})
