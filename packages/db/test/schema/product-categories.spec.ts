import { describe, expect, test } from "vite-plus/test"

import { productCategoriesTable } from "db/schema/product-categories"

describe("product-categories schema", () => {
  test("exports the table", () => {
    expect(productCategoriesTable).toBeDefined()
  })
})
