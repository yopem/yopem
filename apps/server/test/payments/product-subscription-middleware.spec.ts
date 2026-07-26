import * as mod from "server/payments/product-subscription-middleware"
import { describe, expect, test } from "vite-plus/test"

describe("product-subscription-middleware", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
