import { describe, expect, test } from "vite-plus/test"

import {
  categoriesTable,
  categorySchema,
  insertCategorySchema,
  listCategorySchema,
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

  test("categorySchema validates a full select row", () => {
    const result = categorySchema.safeParse({
      id: "cat_1",
      name: "Example",
      slug: "example",
      description: null,
      icon: null,
      sortOrder: 0,
      createdAt: new Date(),
    })
    expect(result.success).toBe(true)
  })

  test("listCategorySchema validates the list output shape", () => {
    const result = listCategorySchema.safeParse({
      id: "cat_1",
      name: "Example",
      slug: "example",
      description: null,
    })
    expect(result.success).toBe(true)
  })
})
