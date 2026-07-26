import { portalRoute } from "server/handlers/portal"
import { describe, expect, test } from "vite-plus/test"

describe("portal handler", () => {
  test("exports a route", () => {
    expect(portalRoute).toBeDefined()
  })
})
