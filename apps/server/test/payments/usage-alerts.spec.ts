import * as mod from "server/payments/usage-alerts"
import { describe, expect, test } from "vitest"

describe("usage-alerts", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
