import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/toast"

describe("ui/components/toast", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.toastManager).toBeDefined()
    expect(mod.anchoredToastManager).toBeDefined()
    expect(mod.ToastProvider).toBeDefined()
    expect(mod.AnchoredToastProvider).toBeDefined()
    expect(mod.ToastPrimitive).toBeDefined()
  })
})
