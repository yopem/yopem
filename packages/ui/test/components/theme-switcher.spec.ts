import { describe, expect, test } from "vite-plus/test"

import { ThemeSwitcher } from "ui/components/theme-switcher"

describe("theme-switcher", () => {
  test("ThemeSwitcher is exported", () => {
    expect(ThemeSwitcher).toBeDefined()
  })
})
