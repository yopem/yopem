import { beforeEach, describe, expect, test, vi } from "vite-plus/test"

import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  validateCategoryIds,
} from "db/services/categories"
import type { MockDb } from "db/test-utils/mock-db"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"

const mockDb = db as unknown as MockDb

describe("categories service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  test("listCategories returns categories", async () => {
    mockDb.setReturn([
      [{ id: "c1", name: "Cat", slug: "cat", description: null }],
    ])
    const result = await listCategories()
    expect(result).toHaveLength(1)
  })

  test("createCategory returns created category", async () => {
    mockDb.setReturn([[], [{ id: "c1", name: "Cat", slug: "cat" }]])
    const result = await createCategory({ name: "Cat" })
    expect(result.slug).toBe("cat")
  })

  test("updateCategory returns updated category", async () => {
    mockDb.setReturn([[], [{ id: "c1", name: "Cat 2", slug: "cat-2" }]])
    const result = await updateCategory({ id: "c1", name: "Cat 2" })
    expect(result.name).toBe("Cat 2")
  })

  test("deleteAsset resolves", async () => {
    mockDb.setReturn([[]])
    await expect(deleteCategory("c1")).resolves.toBeUndefined()
  })

  test("validateCategoryIds returns true when all ids exist", async () => {
    mockDb.setReturn([[{ id: "c1" }, { id: "c2" }]])
    const result = await validateCategoryIds(["c1", "c2"])
    expect(result).toBe(true)
  })
})
