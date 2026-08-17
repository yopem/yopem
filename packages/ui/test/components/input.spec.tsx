import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/input"

describe("ui/components/input", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Input).toBeDefined()
    expect(mod.InputPrimitive).toBeDefined()
  })
})
