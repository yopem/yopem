import { describe, expect, test } from "vitest"

import {
  productVersionsTable,
  insertProductVersionSchema,
  updateProductVersionSchema,
} from "db/schema/product-versions"

describe("product-versions schema", () => {
  test("exports the table", () => {
    expect(productVersionsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertProductVersionSchema.safeParse({
      productId: "p",
      version: 1,
    })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updateProductVersionSchema.safeParse({
      productId: "p",
      version: 1,
    })
    expect(result.success).toBe(true)
  })
})
