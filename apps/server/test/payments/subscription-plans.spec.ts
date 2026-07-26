import * as mod from "server/payments/subscription-plans"
import { describe, expect, test } from "vite-plus/test"

describe("subscription-plans", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
