import { createCustomId } from "@repo/utils/custom-id"
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

export const userSettingsTable = pgTable("user_settings", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  userId: text("user_id").notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  polarCustomerId: text("polar_customer_id"),
  preferences: jsonb("preferences"),
  apiKeys: jsonb("api_keys"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertUserSettingsSchema = createInsertSchema(userSettingsTable)
export const updateUserSettingsSchema = createUpdateSchema(userSettingsTable)

export type SelectUserSettings = typeof userSettingsTable.$inferSelect
export type InsertUserSettings = typeof userSettingsTable.$inferInsert
