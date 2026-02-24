import { createCustomId } from "@repo/shared/custom-id"
import {
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

export const toolRunStatusEnum = ["running", "completed", "failed"] as const
export type ToolRunStatus = (typeof toolRunStatusEnum)[number]

export const toolRunsTable = pgTable(
  "tool_runs",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    toolId: text("tool_id").notNull(),
    userId: text("user_id").notNull(),
    versionId: text("version_id"),
    inputs: jsonb("inputs"),
    outputs: jsonb("outputs"),
    status: text("status", { enum: toolRunStatusEnum })
      .default("running")
      .notNull(),
    errorMessage: text("error_message"),
    tokensUsed: integer("tokens_used"),
    cost: decimal("cost", { precision: 10, scale: 4 }),
    duration: integer("duration"),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => {
    return {
      userIdIdx: index("idx_tool_runs_user_id").on(table.userId),
      createdAtIdx: index("idx_tool_runs_created_at").on(table.createdAt),
      userIdCreatedAtIdx: index("idx_tool_runs_user_id_created_at").on(
        table.userId,
        table.createdAt,
      ),
    }
  },
)

export const insertToolRunSchema = createInsertSchema(toolRunsTable)
export const updateToolRunSchema = createUpdateSchema(toolRunsTable)

export type SelectToolRun = typeof toolRunsTable.$inferSelect
export type InsertToolRun = typeof toolRunsTable.$inferInsert
