import * as mod from "server/payments/product-subscription-middleware"
import { describe, expect, test } from "vitest"

describe("product-subscription-middleware", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
