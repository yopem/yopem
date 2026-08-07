import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/product-form"

describe("apps/admin/components/products/product-form", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ProductForm).toBeDefined()
  })
})
