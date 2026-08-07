import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/product-preview-sheet"

describe("apps/admin/components/products/product-preview-sheet", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ProductPreviewSheet).toBeDefined()
  })
})
