import { createCustomId } from "@repo/shared/custom-id"
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

export const toolVersionsTable = pgTable("tool_versions", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  toolId: text("tool_id").notNull(),
  version: integer("version").notNull(),
  config: jsonb("config"),
  systemRole: text("system_role"),
  userInstructionTemplate: text("user_instruction_template"),
  inputVariable: jsonb("input_variable"),
  outputFormat: text("output_format"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by"),
})

export const insertToolVersionSchema = createInsertSchema(toolVersionsTable)
export const updateToolVersionSchema = createUpdateSchema(toolVersionsTable)

export type SelectToolVersion = typeof toolVersionsTable.$inferSelect
export type InsertToolVersion = typeof toolVersionsTable.$inferInsert
