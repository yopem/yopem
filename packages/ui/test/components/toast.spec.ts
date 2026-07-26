import { describe, expect, test } from "vitest"

import {
  ToastProvider,
  toastManager,
  AnchoredToastProvider,
  anchoredToastManager,
} from "ui/components/toast"

describe("toast", () => {
  test("ToastProvider is exported", () => {
    expect(ToastProvider).toBeDefined()
  })

  test("toastManager is exported", () => {
    expect(toastManager).toBeDefined()
  })

  test("AnchoredToastProvider is exported", () => {
    expect(AnchoredToastProvider).toBeDefined()
  })

  test("anchoredToastManager is exported", () => {
    expect(anchoredToastManager).toBeDefined()
  })
})
