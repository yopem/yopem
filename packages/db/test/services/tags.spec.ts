import { beforeEach, describe, expect, test, vi } from "vite-plus/test"

import {
  createTag,
  deleteTag,
  deleteTags,
  getTag,
  listTags,
  updateTag,
  validateTagIds,
} from "db/services/tags"
import type { MockDb } from "db/test-utils/mock-db"

vi.mock("db", async () => {
  const { createMockDb } = await import("db/test-utils/mock-db")
  return { db: createMockDb() }
})

import { db } from "db"

const mockDb = db as unknown as MockDb

describe("tags service", () => {
  beforeEach(() => {
    mockDb.setReturn([])
  })

  test("listTags returns tags", async () => {
    mockDb.setReturn([[{ id: "t1", name: "Tag", slug: "tag" }]])
    const result = await listTags()
    expect(result).toHaveLength(1)
  })

  test("createTag returns created tag", async () => {
    mockDb.setReturn([[], [{ id: "t1", name: "Tag", slug: "tag" }]])
    const result = await createTag({ name: "Tag" })
    expect(result.slug).toBe("tag")
  })

  test("getTag returns tag when found", async () => {
    mockDb.setReturn([[{ id: "t1", name: "Tag", slug: "tag" }]])
    const result = await getTag("t1")
    expect(result?.id).toBe("t1")
  })

  test("getTag returns null when not found", async () => {
    mockDb.setReturn([[]])
    const result = await getTag("missing")
    expect(result).toBeNull()
  })

  test("updateTag returns updated tag", async () => {
    mockDb.setReturn([[], [{ id: "t1", name: "Tag 2", slug: "tag-2" }]])
    const result = await updateTag({ id: "t1", name: "Tag 2" })
    expect(result.name).toBe("Tag 2")
  })

  test("deleteTag resolves", async () => {
    mockDb.setReturn([[], []])
    await expect(deleteTag("t1")).resolves.toBeUndefined()
  })

  test("deleteTags with empty ids skips the query", async () => {
    const result = await deleteTags([])
    expect(result).toEqual({ success: true, count: 0 })
  })

  test("deleteTags returns count of deleted rows", async () => {
    mockDb.setReturn([[], [{ id: "t1" }, { id: "t2" }, { id: "t3" }]])
    const result = await deleteTags(["t1", "t2", "t3"])
    expect(result).toEqual({ success: true, count: 3 })
  })

  test("deleteTags with no matching ids returns count 0", async () => {
    mockDb.setReturn([[], []])
    const result = await deleteTags(["missing"])
    expect(result).toEqual({ success: true, count: 0 })
  })

  test("validateTagIds returns true when all ids exist", async () => {
    mockDb.setReturn([[{ id: "t1" }, { id: "t2" }]])
    const result = await validateTagIds(["t1", "t2"])
    expect(result).toBe(true)
  })
})
