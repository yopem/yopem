import { describe, expect, test } from "bun:test"
import { authMiddleware } from "server/auth"

describe("authMiddleware", () => {
  test("is exported", () => {
    expect(authMiddleware).toBeDefined()
    expect(typeof authMiddleware).toBe("function")
  })
})
