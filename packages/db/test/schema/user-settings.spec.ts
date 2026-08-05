import * as v from "valibot"
import { describe, expect, test } from "vite-plus/test"

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
    const result = v.safeParse(insertUserSettingsSchema, { userId: "u" })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = v.safeParse(updateUserSettingsSchema, { userId: "u" })
    expect(result.success).toBe(true)
  })
})
