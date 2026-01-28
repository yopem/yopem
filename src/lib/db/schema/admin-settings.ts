import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const adminSettingsTable = pgTable("admin_settings", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertAdminSettingsSchema = createInsertSchema(adminSettingsTable)
export const updateAdminSettingsSchema = createUpdateSchema(adminSettingsTable)

export type SelectAdminSettings = typeof adminSettingsTable.$inferSelect
export type InsertAdminSettings = typeof adminSettingsTable.$inferInsert
