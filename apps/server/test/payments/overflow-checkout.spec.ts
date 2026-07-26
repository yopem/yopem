import * as mod from "server/payments/overflow-checkout"
import { describe, expect, test } from "vitest"

describe("overflow-checkout", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
