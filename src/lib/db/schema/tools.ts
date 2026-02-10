import {
  boolean,
  decimal,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"

import { createCustomId } from "@/lib/utils/custom-id"

export const toolStatusEnum = ["draft", "active", "archived"] as const
export type ToolStatus = (typeof toolStatusEnum)[number]

export const toolOutputFormatEnum = ["plain", "json", "image", "video"] as const
export type ToolOutputFormat = (typeof toolOutputFormatEnum)[number]

export const toolsTable = pgTable("tools", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  status: text("status", { enum: toolStatusEnum }).default("draft").notNull(),
  config: jsonb("config"),
  systemRole: text("system_role"),
  userInstructionTemplate: text("user_instruction_template"),
  inputVariable: jsonb("input_variable"),
  outputFormat: text("output_format", { enum: toolOutputFormatEnum }).default(
    "plain",
  ),
  costPerRun: decimal("cost_per_run", { precision: 10, scale: 4 }).default("0"),
  markup: decimal("markup", { precision: 5, scale: 4 }).default("0.2000"),
  isPublic: boolean("is_public").default(true),
  categoryId: text("category_id"),
  apiKeyId: text("api_key_id"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertToolSchema = createInsertSchema(toolsTable).extend({
  slug: z.string().optional(),
})
export const updateToolSchema = createUpdateSchema(toolsTable)

export type SelectTool = typeof toolsTable.$inferSelect
export type InsertTool = typeof toolsTable.$inferInsert
