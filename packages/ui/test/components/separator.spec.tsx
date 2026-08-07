import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/separator"

describe("ui/components/separator", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Separator).toBeDefined()
    expect(mod.SeparatorPrimitive).toBeDefined()
  })
})
