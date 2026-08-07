import { describe, expect, test } from "vite-plus/test"

import * as mod from "@/components/products/products-table"

describe("apps/admin/components/products/products-table", () => {
  test("exports module members", () => {
    expect(mod).toBeDefined()
    expect(mod.ProductsTable).toBeDefined()
  })
})
