import * as v from "valibot"
import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("bun", () => ({ SQL: class SQLMock {} }))
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
    const result = v.safeParse(insertCategorySchema, {
      name: "Cat",
      slug: "cat",
    })
    expect(result.success).toBe(true)
  })
  test("update schema validates a partial row", () => {
    const result = v.safeParse(updateCategorySchema, {
      name: "Cat",
      slug: "cat",
    })
    expect(result.success).toBe(true)
  })
  test("categorySchema validates a full select row", () => {
    const result = v.safeParse(categorySchema, {
      id: "cat_1",
      name: "Example",
      slug: "example",
      description: null,
      icon: null,
      parentId: null,
      sortOrder: 0,
      status: "active",
      createdAt: new Date(),
    })
    expect(result.success).toBe(true)
  })
  test("listCategorySchema validates the list output shape", () => {
    const result = v.safeParse(listCategorySchema, {
      id: "cat_1",
      name: "Example",
      slug: "example",
      description: null,
      parentId: null,
      sortOrder: 0,
      status: "active",
    })
    expect(result.success).toBe(true)
  })
})
