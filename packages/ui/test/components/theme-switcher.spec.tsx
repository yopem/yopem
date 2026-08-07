import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/theme-switcher"

describe("ui/components/theme-switcher", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ThemeSwitcher).toBeDefined()
  })
})
