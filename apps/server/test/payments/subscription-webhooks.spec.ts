import * as mod from "server/payments/subscription-webhooks"
import { describe, expect, test } from "vite-plus/test"

describe("subscription-webhooks", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
