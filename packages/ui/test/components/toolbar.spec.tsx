import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/toolbar"

describe("ui/components/toolbar", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Toolbar).toBeDefined()
    expect(mod.ToolbarButton).toBeDefined()
    expect(mod.ToolbarLink).toBeDefined()
    expect(mod.ToolbarInput).toBeDefined()
    expect(mod.ToolbarGroup).toBeDefined()
  })
})
