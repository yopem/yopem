import { describe, expect, test } from "vite-plus/test"

import * as mod from "ui/components/product-input-field"

describe("ui/components/product-input-field", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ProductInputField).toBeDefined()
  })
})
