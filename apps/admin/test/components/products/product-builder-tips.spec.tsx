import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/product-builder-tips"

describe("apps/admin/components/products/product-builder-tips", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ProductBuilderTips).toBeDefined()
  })
})
