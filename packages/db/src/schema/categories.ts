import { createCustomId } from "@repo/utils/custom-id"
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

export const categoriesTable = pgTable("categories", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
})

export const insertCategorySchema = createInsertSchema(categoriesTable)
export const updateCategorySchema = createUpdateSchema(categoriesTable)

export type SelectCategory = typeof categoriesTable.$inferSelect
export type InsertCategory = typeof categoriesTable.$inferInsert
