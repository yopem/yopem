import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/toggle"

describe("ui/components/toggle", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.toggleVariants).toBeDefined()
    expect(mod.Toggle).toBeDefined()
    expect(mod.TogglePrimitive).toBeDefined()
  })
})
