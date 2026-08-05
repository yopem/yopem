import { beforeEach, describe, expect, test, vi } from "vite-plus/test"

import {
  assertSlugAvailable,
  generateUniqueAssetFilename,
  generateUniqueCategorySlug,
  generateUniqueProductSlug,
  generateUniqueTagSlug,
  isSlugAvailable,
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

  test("generateUniqueAssetFilename returns slugified filename", async () => {
    mockDb.setReturn([[]])
    const result = await generateUniqueAssetFilename("My Photo.png", "images")
    expect(result).toBe("my-photo.webp")
  })

  test("generateUniqueAssetFilename appends suffix when filename exists", async () => {
    mockDb.setReturn([[{ id: "a1" }], [{ id: "a2" }], []])
    const result = await generateUniqueAssetFilename("Report.pdf", "documents")
    expect(result).toBe("report-3.pdf")
  })

  test("generateUniqueTagSlug excludes id", async () => {
    mockDb.setReturn([[]])
    const result = await generateUniqueTagSlug("Tag", "t1")
    expect(result).toBe("tag")
  })

  test("isSlugAvailable returns true when no row exists", async () => {
    mockDb.setReturn([[]])
    const result = await isSlugAvailable("product", "hello")
    expect(result).toBe(true)
  })

  test("isSlugAvailable returns false when row exists", async () => {
    mockDb.setReturn([[{ id: "p1" }]])
    const result = await isSlugAvailable("category", "taken")
    expect(result).toBe(false)
  })

  test("assertSlugAvailable returns slug when free", async () => {
    mockDb.setReturn([[]])
    const result = await assertSlugAvailable("tag", "free")
    expect(result).toBe("free")
  })

  test("assertSlugAvailable throws when taken", async () => {
    mockDb.setReturn([[{ id: "t1" }]])
    await expect(assertSlugAvailable("tag", "taken")).rejects.toThrow(
      "already in use",
    )
  })
})
