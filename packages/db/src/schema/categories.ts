import type { AnyPgColumn } from "drizzle-orm/pg-core"

import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-valibot"
import * as v from "valibot"

import { createCustomId } from "utils/custom-id"

export const categoriesTable = pgTable(
  "categories",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    icon: text("icon"),
    parentId: text("parent_id").references(
      (): AnyPgColumn => categoriesTable.id,
      { onDelete: "set null" },
    ),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      parentIdIdx: index("idx_categories_parent_id").on(table.parentId),
    }
  },
)

export const insertCategorySchema = createInsertSchema(categoriesTable)
export const updateCategorySchema = createUpdateSchema(categoriesTable)
export const categorySchema = createSelectSchema(categoriesTable)
export const listCategorySchema = v.pick(categorySchema, [
  "id",
  "name",
  "slug",
  "description",
  "parentId",
  "sortOrder",
])

export type SelectCategory = typeof categoriesTable.$inferSelect
export type InsertCategory = typeof categoriesTable.$inferInsert
