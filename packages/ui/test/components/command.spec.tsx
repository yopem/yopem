import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/command"

describe("ui/components/command", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.CommandDialog).toBeDefined()
    expect(mod.CommandDialogPortal).toBeDefined()
    expect(mod.CommandCreateHandle).toBeDefined()
    expect(mod.CommandDialogTrigger).toBeDefined()
    expect(mod.CommandDialogBackdrop).toBeDefined()
  })
})
