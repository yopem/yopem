import { describe, expect, test } from "vite-plus/test"

import {
  adminSettingSchema,
  adminSettingsTable,
  insertAdminSettingsSchema,
  updateAdminSettingsSchema,
} from "db/schema/admin-settings"

describe("admin-settings schema", () => {
  test("exports the table", () => {
    expect(adminSettingsTable).toBeDefined()
  })

  test("insert schema validates a valid row", () => {
    const result = insertAdminSettingsSchema.safeParse({ settingKey: "theme" })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = updateAdminSettingsSchema.safeParse({ settingKey: "theme" })
    expect(result.success).toBe(true)
  })

  test("adminSettingSchema validates a full select row", () => {
    const result = adminSettingSchema.safeParse({
      id: "set_1",
      settingKey: "theme",
      settingValue: "dark",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(result.success).toBe(true)
  })
})
