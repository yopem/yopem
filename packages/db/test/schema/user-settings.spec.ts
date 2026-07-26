import { describe, expect, test } from "vitest"

import {
  userSettingsTable,
  insertUserSettingsSchema,
  updateUserSettingsSchema,
} from "db/schema/user-settings"

describe("user-settings schema", () => {
  test("exports the table", () => {
    expect(userSettingsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertUserSettingsSchema.safeParse({ userId: "u" })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updateUserSettingsSchema.safeParse({ userId: "u" })
    expect(result.success).toBe(true)
  })
})
