import { portalRoute } from "server/handlers/portal"
import { describe, expect, test } from "vitest"

describe("portal handler", () => {
  test("exports a route", () => {
    expect(portalRoute).toBeDefined()
  })
})
