import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/use-product-form"

describe("apps/admin/components/products/use-product-form", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.useProductForm).toBeDefined()
  })
})
