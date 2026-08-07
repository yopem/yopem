import * as v from "valibot"
import { describe, expect, test, vi } from "vite-plus/test"

vi.mock("bun", () => ({ SQL: class SQLMock {} }))
import {
  tagsTable,
  insertTagSchema,
  updateTagSchema,
  tagSchema,
  listTagSchema,
} from "db/schema/tags"
describe("tags schema", () => {
  test("exports the table", () => {
    expect(tagsTable).toBeDefined()
  })
  test("insert schema validates a valid row", () => {
    const result = v.safeParse(insertTagSchema, { name: "Tag", slug: "tag" })
    expect(result.success).toBe(true)
  })
  test("update schema validates a partial row", () => {
    const result = v.safeParse(updateTagSchema, { name: "Tag", slug: "tag" })
    expect(result.success).toBe(true)
  })
  test("tagSchema validates a full select row", () => {
    const result = v.safeParse(tagSchema, {
      id: "tag_1",
      name: "example",
      slug: "example",
      status: "active",
      createdAt: new Date(),
    })
    expect(result.success).toBe(true)
  })
  test("listTagSchema validates the list output shape", () => {
    const result = v.safeParse(listTagSchema, {
      id: "tag_1",
      name: "example",
      slug: "example",
      status: "active",
    })
    expect(result.success).toBe(true)
  })
})
