import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/tooltip"

describe("ui/components/tooltip", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.TooltipCreateHandle).toBeDefined()
    expect(mod.TooltipProvider).toBeDefined()
    expect(mod.Tooltip).toBeDefined()
    expect(mod.TooltipTrigger).toBeDefined()
    expect(mod.TooltipPopup).toBeDefined()
  })
})
