import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/button"

describe("ui/components/button", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.buttonVariants).toBeDefined()
    expect(mod.Button).toBeDefined()
  })
})
