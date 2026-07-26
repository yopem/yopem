import { describe, expect, test } from "vite-plus/test"

import ThemeSwitcher from "ui/components/theme-switcher"

describe("theme-switcher", () => {
  test("default export is defined", () => {
    expect(ThemeSwitcher).toBeDefined()
  })
})
