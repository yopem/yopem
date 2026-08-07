import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/theme-provider"

describe("ui/components/theme-provider", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ThemeProvider).toBeDefined()
  })
})
