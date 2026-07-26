import { authMiddleware } from "server/auth"
import { describe, expect, test } from "vitest"

describe("authMiddleware", () => {
  test("is exported", () => {
    expect(authMiddleware).toBeDefined()
    expect(typeof authMiddleware).toBe("function")
  })
})
