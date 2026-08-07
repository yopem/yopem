import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/product-form-tag-dialog"

describe("apps/admin/components/products/product-form-tag-dialog", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ProductFormTagDialog).toBeDefined()
  })
})
