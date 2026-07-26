import * as mod from "server/payments/quota-check"
import { describe, expect, test } from "vitest"

describe("quota-check", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
