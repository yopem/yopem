import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/label"

describe("ui/components/label", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.Label).toBeDefined()
  })
})
