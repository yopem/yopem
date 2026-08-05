import * as v from "valibot"
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
    const result = v.safeParse(insertAdminSettingsSchema, {
      settingKey: "theme",
    })
    expect(result.success).toBe(true)
  })

  test("update schema validates a partial row", () => {
    const result = v.safeParse(updateAdminSettingsSchema, {
      settingKey: "theme",
    })
    expect(result.success).toBe(true)
  })

  test("adminSettingSchema validates a full select row", () => {
    const result = v.safeParse(adminSettingSchema, {
      id: "set_1",
      settingKey: "theme",
      settingValue: "dark",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    expect(result.success).toBe(true)
  })
})
