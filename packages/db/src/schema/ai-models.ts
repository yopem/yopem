import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

import { createCustomId } from "utils/custom-id"

export const aiModelsTable = pgTable(
  "ai_models",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createCustomId()),
    provider: text().notNull(),
    modelId: text("model_id").notNull(),
    displayName: text("display_name").notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    providerModelUnique: unique().on(table.provider, table.modelId),
    providerIdx: index("ai_models_provider_idx").on(table.provider),
    enabledIdx: index("ai_models_enabled_idx").on(table.isEnabled),
  }),
)

export const insertAIModelSchema = createInsertSchema(aiModelsTable)
export const updateAIModelSchema = createUpdateSchema(aiModelsTable)

export type SelectAIModel = typeof aiModelsTable.$inferSelect
export type InsertAIModel = typeof aiModelsTable.$inferInsert
