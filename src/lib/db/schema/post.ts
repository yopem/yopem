import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const postTable = pgTable("posts", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  title: text("title").notNull(),
  description: text("description"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertPostSchema = createInsertSchema(postTable)
export const updatePostSchema = createUpdateSchema(postTable)

export type SelectPost = typeof postTable.$inferSelect
export type InsertPost = typeof postTable.$inferInsert
