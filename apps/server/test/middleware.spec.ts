import { assertSession, requireAdmin, requireAuth } from "server/middleware"
import { describe, expect, test } from "vite-plus/test"

describe("middleware", () => {
  test("exports required middleware", () => {
    expect(requireAuth).toBeDefined()
    expect(requireAdmin).toBeDefined()
    expect(assertSession).toBeDefined()
  })
})
