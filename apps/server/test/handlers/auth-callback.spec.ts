import { describe, expect, test } from "bun:test"
import { authCallbackRoute } from "server/handlers/auth-callback"

describe("auth-callback handler", () => {
  test("exports a route", () => {
    expect(authCallbackRoute).toBeDefined()
  })
})
