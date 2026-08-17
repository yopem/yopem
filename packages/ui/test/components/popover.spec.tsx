import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/popover"

describe("ui/components/popover", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.PopoverCreateHandle).toBeDefined()
    expect(mod.Popover).toBeDefined()
    expect(mod.PopoverTrigger).toBeDefined()
    expect(mod.PopoverPopup).toBeDefined()
    expect(mod.PopoverClose).toBeDefined()
  })
})
