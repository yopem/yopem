import { createId } from "@yopem/utils/id"
import { json, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"

export const MESSAGE_ROLE = ["assistant", "user"] as const
export const messageRole = z.enum(MESSAGE_ROLE)

export const messageRoleEnum = pgEnum("message_rol", MESSAGE_ROLE)

export const messageTable = pgTable("messages", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  content: text("content").notNull(),
  chatId: text("chat_id").notNull(),
  messageId: text("message_id").notNull(),
  role: messageRoleEnum("role").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertMessageSchema = createInsertSchema(messageTable)
export const updateMessageSchema = createUpdateSchema(messageTable)

export type InsertMessage = z.infer<typeof insertMessageSchema>
export type UpdateMessage = z.infer<typeof updateMessageSchema>

export type SelectMessage = typeof messageTable.$inferSelect

export type MessageRole = z.infer<typeof messageRole>
