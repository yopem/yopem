import { authCallbackRoute } from "server/handlers/auth-callback"
import { describe, expect, test } from "vite-plus/test"

describe("auth-callback handler", () => {
  test("exports a route", () => {
    expect(authCallbackRoute).toBeDefined()
  })
})
