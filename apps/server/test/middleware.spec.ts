import { assertSession, requireAdmin, requireAuth } from "server/middleware"
import { describe, expect, test } from "vitest"

describe("middleware", () => {
  test("exports required middleware", () => {
    expect(requireAuth).toBeDefined()
    expect(requireAdmin).toBeDefined()
    expect(assertSession).toBeDefined()
  })
})
