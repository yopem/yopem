import { describe, expect, test } from "vite-plus/test"

import { productTagsTable } from "db/schema/product-tags"

describe("product-tags schema", () => {
  test("exports the table", () => {
    expect(productTagsTable).toBeDefined()
  })
})
