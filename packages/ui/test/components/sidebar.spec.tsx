import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/sidebar"

describe("ui/components/sidebar", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.useSidebar).toBeDefined()
    expect(mod.SidebarProvider).toBeDefined()
    expect(mod.Sidebar).toBeDefined()
    expect(mod.SidebarTrigger).toBeDefined()
    expect(mod.SidebarRail).toBeDefined()
  })
})
