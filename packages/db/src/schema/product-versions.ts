import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "utils/custom-id"

export const productVersionsTable = pgTable("product_versions", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  productId: text("product_id").notNull(),
  version: integer("version").notNull(),
  config: jsonb("config"),
  systemRole: text("system_role"),
  userInstructionTemplate: text("user_instruction_template"),
  inputVariable: jsonb("input_variable").$type<
    {
      variableName: string
      description: string
      type: string
      options?: { label: string; value: string }[]
    }[]
  >(),
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
