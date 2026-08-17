import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/alert-dialog"

describe("ui/components/alert-dialog", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.AlertDialogCreateHandle).toBeDefined()
    expect(mod.AlertDialog).toBeDefined()
    expect(mod.AlertDialogPortal).toBeDefined()
    expect(mod.AlertDialogTrigger).toBeDefined()
    expect(mod.AlertDialogBackdrop).toBeDefined()
  })
})
