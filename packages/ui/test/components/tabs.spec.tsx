import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/tabs"

describe("ui/components/tabs", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Tabs).toBeDefined()
    expect(mod.TabsList).toBeDefined()
    expect(mod.TabsTab).toBeDefined()
    expect(mod.TabsPanel).toBeDefined()
    expect(mod.TabsPrimitive).toBeDefined()
  })
})
