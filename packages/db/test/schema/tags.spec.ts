import { describe, expect, test } from "vitest"

import { tagsTable, insertTagSchema, updateTagSchema } from "db/schema/tags"

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
})
