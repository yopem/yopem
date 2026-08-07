import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/product-form-category-dialog"

describe("apps/admin/components/products/product-form-category-dialog", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ProductFormCategoryDialog).toBeDefined()
  })
})
