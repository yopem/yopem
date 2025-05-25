import { relations } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"

import { createId } from "@/lib/utils/id"
import { userTable } from "./user"

export const FILE_CATEGORY = ["all", "chat"] as const

export const FILE_TYPE = [
  "image",
  "audio",
  "video",
  "document",
  "other",
] as const

export const fileCategory = z.enum(FILE_CATEGORY)
export const fileType = z.enum(FILE_TYPE)

export const fileCategoryEnum = pgEnum("file_category", FILE_CATEGORY)
export const fileTypeEnum = pgEnum("file_type", FILE_TYPE)

export const fileTable = pgTable("files", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  url: text("url").notNull(),
  fileType: text("file_type").notNull(),
  category: fileCategoryEnum("category").notNull().default("chat"),
  type: fileTypeEnum("type").notNull().default("image"),
  description: text("description"),
  authorId: text("author_id")
    .notNull()
    .references(() => userTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const fileRelations = relations(fileTable, ({ one }) => ({
  author: one(userTable, {
    fields: [fileTable.authorId],
    references: [userTable.id],
  }),
}))

export const insertFileSchema = createInsertSchema(fileTable)
export const updateFileSchema = createUpdateSchema(fileTable)

export type SelectFile = typeof fileTable.$inferSelect
export type InsertFile = typeof fileTable.$inferInsert

export type FileCategory = z.infer<typeof fileCategory>
export type FileType = z.infer<typeof fileType>
