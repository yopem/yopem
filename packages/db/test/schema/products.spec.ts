import { describe, expect, test } from "vite-plus/test"

import {
  productsTable,
  insertProductSchema,
  updateProductSchema,
  productStatusEnum,
  productOutputFormatEnum,
} from "db/schema/products"

describe("products schema", () => {
  test("exports the table", () => {
    expect(productsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertProductSchema.safeParse({ name: "Prod", slug: "prod" })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updateProductSchema.safeParse({ name: "Prod", slug: "prod" })
    expect(result.success).toBe(true)
  })

  test("exports productStatusEnum", () => {
    expect(productStatusEnum).toBeDefined()
    expect(productStatusEnum.length).toBeGreaterThan(0)
  })

  test("exports productOutputFormatEnum", () => {
    expect(productOutputFormatEnum).toBeDefined()
    expect(productOutputFormatEnum.length).toBeGreaterThan(0)
  })
})
