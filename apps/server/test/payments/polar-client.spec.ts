import * as mod from "server/payments/polar-client"
import { describe, expect, test } from "vitest"

describe("polar-client", () => {
  test("module exports are defined", () => {
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
