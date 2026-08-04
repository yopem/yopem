import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "utils/custom-id"

import type { ProductWorkflow } from "./product-workflow"

export const productVersionsTable = pgTable("product_versions", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  productId: text("product_id").notNull(),
  version: integer("version").notNull(),
  config: jsonb("config"),
  workflow: jsonb("workflow").$type<ProductWorkflow>(),
  outputFormat: text("output_format"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by"),
})

export const insertProductVersionSchema =
  createInsertSchema(productVersionsTable)
export const updateProductVersionSchema =
  createUpdateSchema(productVersionsTable)

export type SelectProductVersion = typeof productVersionsTable.$inferSelect
export type InsertProductVersion = typeof productVersionsTable.$inferInsert
