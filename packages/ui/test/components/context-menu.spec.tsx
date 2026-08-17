import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/context-menu"

describe("ui/components/context-menu", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ContextMenu).toBeDefined()
    expect(mod.ContextMenuPortal).toBeDefined()
    expect(mod.ContextMenuTrigger).toBeDefined()
    expect(mod.ContextMenuPopup).toBeDefined()
    expect(mod.ContextMenuGroup).toBeDefined()
  })
})
