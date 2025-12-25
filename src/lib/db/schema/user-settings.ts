import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const userSettingsTable = pgTable("user_settings", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  userId: text("user_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertUserSettingsSchema = createInsertSchema(userSettingsTable)
export const updateUserSettingsSchema = createUpdateSchema(userSettingsTable)

export type SelectUserSettings = typeof userSettingsTable.$inferSelect
export type InsertUserSettings = typeof userSettingsTable.$inferInsert
