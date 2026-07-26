import { checkoutRoute } from "server/handlers/checkout"
import { describe, expect, test } from "vite-plus/test"

describe("checkout handler", () => {
  test("exports a route", () => {
    expect(checkoutRoute).toBeDefined()
  })
})
