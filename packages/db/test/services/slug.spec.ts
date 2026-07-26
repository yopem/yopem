import { beforeEach, describe, expect, test, vi } from "vitest"

import {
  generateUniqueCategorySlug,
  generateUniqueProductSlug,
  generateUniqueTagSlug,
} from "db/services/slug"
import type { MockDb } from "db/test-utils/mock-db"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"

const mockDb = db as unknown as MockDb

describe("slug service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  test("generateUniqueProductSlug returns slug when available", async () => {
    mockDb.setReturn([[]])
    const result = await generateUniqueProductSlug("Hello World")
    expect(result).toBe("hello-world")
  })

  test("generateUniqueProductSlug appends suffix when slug exists", async () => {
    mockDb.setReturn([[{ id: "p1" }], [{ id: "p2" }], []])
    const result = await generateUniqueProductSlug("Hello World")
    expect(result).toBe("hello-world-3")
  })

  test("generateUniqueCategorySlug returns slug", async () => {
    mockDb.setReturn([[]])
    const result = await generateUniqueCategorySlug("Category")
    expect(result).toBe("category")
  })

  test("generateUniqueTagSlug excludes id", async () => {
    mockDb.setReturn([[]])
    const result = await generateUniqueTagSlug("Tag", "t1")
    expect(result).toBe("tag")
  })
})
