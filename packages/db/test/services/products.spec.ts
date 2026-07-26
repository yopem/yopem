import { beforeEach, describe, expect, test, vi } from "vitest"

import {
  createProduct,
  deleteProduct,
  duplicateProduct,
  getProductById,
  getProductBySlug,
  getProductBySlugId,
  getProductVersions,
  getPublicProductById,
  listProducts,
  updateProduct,
  updateProductStatus,
} from "db/services/products"
import type { MockDb } from "db/test-utils/mock-db"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"

const mockDb = db as unknown as MockDb

describe("products service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  test("listProducts returns products list", async () => {
    mockDb.setReturn([
      [{ productId: "p1" }],
      [{ id: "p1", name: "Prod", status: "active" }],
      [],
    ])
    const result = await listProducts({ limit: 10 })
    expect(result.products).toBeDefined()
  })

  test("getProductById returns product with relations", async () => {
    mockDb.setReturn([
      [{ id: "p1", name: "Prod", thumbnailId: "a1" }],
      [{ id: "c1", name: "Cat", slug: "cat" }],
      [{ id: "t1", name: "Tag", slug: "tag" }],
      [{ id: "a1", url: "https://x/a.webp", originalName: "a.webp" }],
    ])
    const result = await getProductById("p1")
    expect(result?.name).toBe("Prod")
    expect(result?.categories).toHaveLength(1)
  })

  test("getProductBySlug returns null when not found", async () => {
    mockDb.query = {
      productsTable: { findFirst: vi.fn().mockResolvedValue(null) },
    }
    const result = await getProductBySlug("missing")
    expect(result).toBeNull()
  })

  test("getPublicProductById returns public product", async () => {
    mockDb.setReturn([
      [{ id: "p1", name: "Prod", thumbnailId: null }],
      [],
      [],
      [],
    ])
    const result = await getPublicProductById("p1")
    expect(result?.name).toBe("Prod")
  })

  test("createProduct returns id and slug", async () => {
    mockDb.setReturn([[], [{ id: "p1", slug: "prod" }]])
    const result = await createProduct({ name: "Prod" })
    expect(result?.id).toBeTypeOf("string")
    expect(result?.slug).toBe("prod")
  })

  test("updateProduct returns success", async () => {
    mockDb.setReturn([
      [{ name: "Old" }],
      [{ id: "old" }],
      [],
      [{ id: "p1", name: "New", slug: "new" }],
    ])
    const result = await updateProduct("p1", { name: "New" })
    expect(result?.success).toBe(true)
  })

  test("deleteProduct returns true when deleted", async () => {
    mockDb.setReturn([[{ id: "p1" }]])
    const result = await deleteProduct("p1")
    expect(result).toBe(true)
  })

  test("duplicateProduct returns new id", async () => {
    mockDb.setReturn([
      [{ id: "p1", name: "Prod", slug: "prod", status: "active" }],
      [{ id: "old" }],
      [],
      [{ id: "p2", slug: "prod-copy" }],
    ])
    const result = await duplicateProduct("p1", "u1")
    expect(result?.id).toBeTypeOf("string")
  })

  test("updateProductStatus returns count", async () => {
    mockDb.setReturn([[{ id: "p1" }, { id: "p2" }]])
    const result = await updateProductStatus(["p1", "p2"], "archived")
    expect(result?.count).toBe(2)
  })

  test("getProductVersions returns versions", async () => {
    mockDb.setReturn([[{ id: "v1", version: 1 }]])
    const result = await getProductVersions("p1")
    expect(result).toHaveLength(1)
  })

  test("getProductBySlugId returns id", async () => {
    mockDb.setReturn([[{ id: "p1" }]])
    const result = await getProductBySlugId("prod")
    expect(result?.id).toBe("p1")
  })
})
