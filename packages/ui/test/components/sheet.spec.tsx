import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/sheet"

describe("ui/components/sheet", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Sheet).toBeDefined()
    expect(mod.SheetPortal).toBeDefined()
    expect(mod.SheetTrigger).toBeDefined()
    expect(mod.SheetClose).toBeDefined()
    expect(mod.SheetBackdrop).toBeDefined()
  })
})
