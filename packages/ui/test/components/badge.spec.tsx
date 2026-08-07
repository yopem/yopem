import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/badge"

describe("ui/components/badge", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.badgeVariants).toBeDefined()
    expect(mod.Badge).toBeDefined()
  })
})
