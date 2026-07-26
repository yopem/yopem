import { describe, expect, test } from "vitest"

import { productCategoriesTable } from "db/schema/product-categories"

describe("product-categories schema", () => {
  test("exports the table", () => {
    expect(productCategoriesTable).toBeDefined()
  })
})
