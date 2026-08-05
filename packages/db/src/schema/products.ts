import {
  boolean,
  decimal,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-valibot"
import * as v from "valibot"

import { createCustomId } from "utils/custom-id"

import { productWorkflowSchema, type ProductWorkflow } from "./product-workflow"

export const productStatusEnum = ["draft", "active", "archived"] as const
export type ProductStatus = (typeof productStatusEnum)[number]

export const productOutputFormatEnum = [
  "plain",
  "json",
  "image",
  "video",
] as const
export type ProductOutputFormat = (typeof productOutputFormatEnum)[number]

export const productsTable = pgTable("products", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createCustomId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  descriptionContent: jsonb("description_content").$type<unknown[]>(),
  excerpt: text("excerpt"),
  status: text("status", { enum: productStatusEnum })
    .default("draft")
    .notNull(),
  config: jsonb("config"),
  workflow: jsonb("workflow").$type<ProductWorkflow>(),
  outputFormat: text("output_format", {
    enum: productOutputFormatEnum,
  }).default("plain"),
  costPerRun: decimal("cost_per_run", { precision: 10, scale: 4 }).default("0"),
  markup: decimal("markup", { precision: 5, scale: 4 }).default("0.2000"),
  isPublic: boolean("is_public").default(true),
  apiKeyId: text("api_key_id"),
  thumbnailId: text("thumbnail_id"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

const workflowJsonSchema = v.custom<ProductWorkflow>((value) => {
  if (value === null || value === undefined) return true
  return v.is(productWorkflowSchema, value)
})

const productOverrides = {
  slug: v.optional(v.string()),
  tagIds: v.optional(v.array(v.string())),
  categoryIds: v.optional(v.array(v.string())),
  thumbnailId: v.optional(v.string()),
  workflow: v.optional(workflowJsonSchema),
}

export const insertProductSchema = v.object({
  ...v.omit(createInsertSchema(productsTable), ["workflow"]).entries,
  ...productOverrides,
})
export const updateProductSchema = v.object({
  ...v.omit(createUpdateSchema(productsTable), ["workflow"]).entries,
  ...productOverrides,
  id: v.optional(v.string()),
})
export const productSchema = createSelectSchema(productsTable)
export const publicProductSchema = v.omit(productSchema, [
  "apiKeyId",
  "config",
  "thumbnailId",
  "createdBy",
])

export type SelectProduct = typeof productsTable.$inferSelect & {
  categories: { id: string; name: string; slug: string }[]
  tags: { id: string; name: string; slug: string }[]
  thumbnail?: { id: string; url: string; originalName: string } | null
}
export type InsertProduct = typeof productsTable.$inferInsert
