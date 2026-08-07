import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/menu"

describe("ui/components/menu", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.MenuCreateHandle).toBeDefined()
    expect(mod.Menu).toBeDefined()
    expect(mod.MenuPortal).toBeDefined()
    expect(mod.MenuTrigger).toBeDefined()
    expect(mod.MenuPopup).toBeDefined()
  })
})
