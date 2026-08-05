import * as v from "valibot"
import { describe, expect, test } from "vite-plus/test"

import {
  productsTable,
  insertProductSchema,
  productSchema,
  publicProductSchema,
  updateProductSchema,
  productStatusEnum,
  productOutputFormatEnum,
} from "db/schema/products"

describe("products schema", () => {
  test("exports the table", () => {
    expect(productsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = v.safeParse(insertProductSchema, {
      name: "Prod",
      slug: "prod",
    })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = v.safeParse(updateProductSchema, {
      name: "Prod",
      slug: "prod",
    })
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

  test("productSchema omits nothing (full select schema)", () => {
    const keys = Object.keys(productSchema.entries)
    for (const field of [
      "id",
      "name",
      "slug",
      "apiKeyId",
      "config",
      "workflow",
    ]) {
      expect(keys).toContain(field)
    }
  })

  test("publicProductSchema omits sensitive fields", () => {
    const keys = Object.keys(publicProductSchema.entries)
    for (const sensitive of [
      "apiKeyId",
      "config",
      "thumbnailId",
      "createdBy",
    ]) {
      expect(keys).not.toContain(sensitive)
    }
    expect(keys).toContain("id")
    expect(keys).toContain("name")
    expect(keys).toContain("slug")
    expect(keys).toContain("workflow")
  })
})
