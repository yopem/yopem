import * as mod from "server/payments/subscription-cache"
import { describe, expect, test } from "vite-plus/test"

describe("subscription-cache", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
