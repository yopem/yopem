import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createId } from "@/lib/utils/id"
import { fileTable } from "./file"

export const chatTable = pgTable("chats", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text("title").notNull(),
  focusMode: text("focusMode").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const chatRelations = relations(chatTable, ({ many }) => ({
  chatFiles: many(fileTable),
}))

export const insertChatSchema = createInsertSchema(chatTable)
export const updateChatSchema = createUpdateSchema(chatTable)

export type SelectChat = typeof chatTable.$inferSelect
