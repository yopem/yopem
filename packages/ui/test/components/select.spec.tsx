import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/select"

describe("ui/components/select", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Select).toBeDefined()
    expect(mod.selectTriggerVariants).toBeDefined()
    expect(mod.selectTriggerIconClassName).toBeDefined()
    expect(mod.SelectButton).toBeDefined()
    expect(mod.SelectTrigger).toBeDefined()
  })
})
