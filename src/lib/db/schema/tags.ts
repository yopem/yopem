import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const tagsTable = pgTable("tags", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const insertTagSchema = createInsertSchema(tagsTable)
export const updateTagSchema = createUpdateSchema(tagsTable)

export type SelectTag = typeof tagsTable.$inferSelect
export type InsertTag = typeof tagsTable.$inferInsert
