import * as v from "valibot"
import { describe, expect, test } from "vite-plus/test"

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
    const result = v.safeParse(insertProductVersionSchema, {
      productId: "p",
      version: 1,
    })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = v.safeParse(updateProductVersionSchema, {
      productId: "p",
      version: 1,
    })
    expect(result.success).toBe(true)
  })
})
