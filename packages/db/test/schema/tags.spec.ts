import { describe, expect, test } from "vite-plus/test"

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
    const result = insertTagSchema.safeParse({ name: "Tag", slug: "tag" })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updateTagSchema.safeParse({ name: "Tag", slug: "tag" })
    expect(result.success).toBe(true)
  })

  test("tagSchema validates a full select row", () => {
    const result = tagSchema.safeParse({
      id: "tag_1",
      name: "example",
      slug: "example",
      createdAt: new Date(),
    })
    expect(result.success).toBe(true)
  })

  test("listTagSchema validates the list output shape", () => {
    const result = listTagSchema.safeParse({
      id: "tag_1",
      name: "example",
      slug: "example",
    })
    expect(result.success).toBe(true)
  })
})
