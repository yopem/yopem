import { authCallbackRoute } from "server/handlers/auth-callback"
import { describe, expect, test } from "vitest"

describe("auth-callback handler", () => {
  test("exports a route", () => {
    expect(authCallbackRoute).toBeDefined()
  })
})
