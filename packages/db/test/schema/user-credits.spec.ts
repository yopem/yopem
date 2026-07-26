import { describe, expect, test } from "vite-plus/test"

import {
  userCreditsTable,
  insertUserCreditsSchema,
  updateUserCreditsSchema,
} from "db/schema/user-credits"

describe("user-credits schema", () => {
  test("exports the table", () => {
    expect(userCreditsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertUserCreditsSchema.safeParse({ userId: "u" })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updateUserCreditsSchema.safeParse({ userId: "u" })
    expect(result.success).toBe(true)
  })
})
