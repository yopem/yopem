import { createCustomId } from "@repo/utils/custom-id"
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema, createUpdateSchema } from "drizzle-zod"

export const assetTypeEnum = [
  "images",
  "videos",
  "documents",
  "archives",
  "others",
] as const
export type AssetType = (typeof assetTypeEnum)[number]

export const assetsTable = pgTable("assets", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  type: text("type", { enum: assetTypeEnum }).notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const insertAssetSchema = createInsertSchema(assetsTable)
export const updateAssetSchema = createUpdateSchema(assetsTable)

export type SelectAsset = typeof assetsTable.$inferSelect
export type InsertAsset = typeof assetsTable.$inferInsert
