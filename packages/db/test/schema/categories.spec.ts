import { describe, expect, test } from "vite-plus/test"

import {
  categoriesTable,
  insertCategorySchema,
  updateCategorySchema,
} from "db/schema/categories"

describe("categories schema", () => {
  test("exports the table", () => {
    expect(categoriesTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertCategorySchema.safeParse({ name: "Cat", slug: "cat" })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updateCategorySchema.safeParse({ name: "Cat", slug: "cat" })
    expect(result.success).toBe(true)
  })
})
