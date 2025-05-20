import { createId } from "@yopem/utils/id"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import type { z } from "zod"

export const chatTable = pgTable("chats", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text("title").notNull(),
  focusMode: text("focus_mode").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
})

export const insertChatSchema = createInsertSchema(chatTable)
export const updateChatSchema = createUpdateSchema(chatTable)

export type InsertChat = z.infer<typeof insertChatSchema>
export type UpdateChat = z.infer<typeof updateChatSchema>

export type SelectChat = typeof chatTable.$inferSelect
