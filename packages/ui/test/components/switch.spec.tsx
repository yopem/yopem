import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/switch"

describe("ui/components/switch", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Switch).toBeDefined()
    expect(mod.SwitchPrimitive).toBeDefined()
  })
})
