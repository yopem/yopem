import { beforeEach, describe, expect, test, vi } from "vitest"

import {
  createTag,
  deleteTag,
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

  test("updateTag returns updated tag", async () => {
    mockDb.setReturn([[], [{ id: "t1", name: "Tag 2", slug: "tag-2" }]])
    const result = await updateTag({ id: "t1", name: "Tag 2" })
    expect(result.name).toBe("Tag 2")
  })

  test("deleteTag resolves", async () => {
    mockDb.setReturn([[]])
    await expect(deleteTag("t1")).resolves.toBeUndefined()
  })

  test("validateTagIds returns true when all ids exist", async () => {
    mockDb.setReturn([[{ id: "t1" }, { id: "t2" }]])
    const result = await validateTagIds(["t1", "t2"])
    expect(result).toBe(true)
  })
})
