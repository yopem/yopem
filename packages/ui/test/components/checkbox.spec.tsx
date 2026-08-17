import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/checkbox"

describe("ui/components/checkbox", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Checkbox).toBeDefined()
    expect(mod.CheckboxPrimitive).toBeDefined()
  })
})
