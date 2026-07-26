import * as mod from "server/payments/subscription-checkout"
import { describe, expect, test } from "vitest"

describe("subscription-checkout", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
