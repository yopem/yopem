import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/collapsible-card"

describe("ui/components/collapsible-card", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.CollapsibleCard).toBeDefined()
  })
})
