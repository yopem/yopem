import { describe, expect, test } from "vite-plus/test"

import ThemeProvider from "ui/components/theme-provider"

describe("theme-provider", () => {
  test("default export is defined", () => {
    expect(ThemeProvider).toBeDefined()
  })
})
