import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/dialog"

describe("ui/components/dialog", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.DialogCreateHandle).toBeDefined()
    expect(mod.Dialog).toBeDefined()
    expect(mod.DialogPortal).toBeDefined()
    expect(mod.DialogTrigger).toBeDefined()
    expect(mod.DialogClose).toBeDefined()
  })
})
