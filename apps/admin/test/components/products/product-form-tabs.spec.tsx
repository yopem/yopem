import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/product-form-tabs"

describe("apps/admin/components/products/product-form-tabs", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ProductFormTabs).toBeDefined()
  })
})
