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
} from "drizzle-zod"
import { z } from "zod"

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

const workflowJsonSchema = z.custom<ProductWorkflow>((value) => {
  if (value === null || value === undefined) return true
  return productWorkflowSchema.safeParse(value).success
})

export const insertProductSchema = createInsertSchema(productsTable)
  .omit({ workflow: true })
  .extend({
    slug: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    thumbnailId: z.string().optional(),
    workflow: workflowJsonSchema.optional(),
  })
export const updateProductSchema = createUpdateSchema(productsTable)
  .omit({ workflow: true })
  .extend({
    id: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    categoryIds: z.array(z.string()).optional(),
    thumbnailId: z.string().optional(),
    workflow: workflowJsonSchema.optional(),
  })
export const productSchema = createSelectSchema(productsTable)
export const publicProductSchema = productSchema.omit({
  apiKeyId: true,
  config: true,
  thumbnailId: true,
  createdBy: true,
})

export type SelectProduct = typeof productsTable.$inferSelect & {
  categories: { id: string; name: string; slug: string }[]
  tags: { id: string; name: string; slug: string }[]
  thumbnail?: { id: string; url: string; originalName: string } | null
}
export type InsertProduct = typeof productsTable.$inferInsert
