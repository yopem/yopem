import * as mod from "server/payments/entitlements"
import { describe, expect, test } from "vite-plus/test"

describe("entitlements", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
