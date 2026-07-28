import { ORPCError } from "@orpc/server"
import { executeAIProduct } from "server/llm/executor"
import { decryptApiKey } from "server/utils/crypto"
import { z } from "zod"

import { redisCache } from "cache"
import { getOrCompute } from "cache/services/with-cache"
import { insertProductSchema, updateProductSchema } from "db/schema"
import { getSetting } from "db/services/admin"
import { getAssetById } from "db/services/assets"
import { listCategories, validateCategoryIds } from "db/services/categories"
import {
  createProduct,
  deleteProduct,
  duplicateProduct,
  getPopularProducts,
  getProductById,
  getPublicProductById,
  getPublicProductBySlug,
  insertProductRun,
  listProducts,
  searchProducts,
  updateProduct,
  updateProductStatus,
} from "db/services/products"
import { listTags, validateTagIds } from "db/services/tags"
import type { ApiKeyConfig } from "utils/api-input"
import { createCustomId } from "utils/custom-id"

import { os, requireAdminMiddleware, requireAuthMiddleware } from "./orpc"

const API_KEYS_SETTING_KEY = "api_keys"
const SETTINGS_CACHE_TTL = 300

function validateRequiredInputs(
  inputs: Record<string, string>,
  inputVariables: { variableName: string; isOptional?: boolean }[],
): void {
  const requiredInputs = inputVariables.filter((v) => !v.isOptional)
  const missingInputs = requiredInputs
    .filter((v) => !inputs[v.variableName])
    .map((v) => v.variableName)

  if (missingInputs.length > 0) {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: `Missing required inputs: ${missingInputs.join(", ")}`,
    })
  }
}

function validateSystemRole(systemRole: string): void {
  if (!systemRole || systemRole.trim() === "") {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: "System role is required",
    })
  }
}

function validateUserInstructionTemplate(template: string): void {
  if (!template || template.trim() === "") {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: "User instruction template is required",
    })
  }
}

function validateApiKeyId(apiKeyId: string): void {
  if (!apiKeyId) {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: "API key is required for preview execution",
    })
  }
}

const getApiKeys = () =>
  getOrCompute<ApiKeyConfig[]>(
    redisCache,
    API_KEYS_SETTING_KEY,
    async () => {
      const settings = await getSetting(API_KEYS_SETTING_KEY)
      if (!settings?.settingValue) {
        throw new ORPCError("NOT_FOUND", {
          status: 404,
          message: "No API keys configured",
        })
      }
      return settings.settingValue as ApiKeyConfig[]
    },
    SETTINGS_CACHE_TTL,
  )

const productListInputSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  cursor: z.string().optional(),
  search: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  status: z.enum(["draft", "active", "archived", "all"]).optional(),
  priceFilter: z.enum(["all", "free", "paid"]).optional(),
  tagIds: z.array(z.string()).optional(),
})

const productSearchInputSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().min(1).max(20).default(8).optional(),
})

const productExecuteInputSchema = z.object({
  id: z.string(),
  inputs: z.record(z.string(), z.unknown()),
})

const previewInputSchema = z.object({
  systemRole: z.string(),
  userInstructionTemplate: z.string(),
  inputVariable: z.array(
    z.object({
      variableName: z.string(),
      type: z.enum([
        "text",
        "long_text",
        "number",
        "boolean",
        "select",
        "image",
        "video",
      ]),
      description: z.string(),
      options: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
      isOptional: z.boolean().optional(),
    }),
  ),
  inputs: z.record(z.string(), z.string()),
  config: z.object({
    modelEngine: z.string(),
  }),
  outputFormat: z.enum(["plain", "json", "image", "video"]),
  apiKeyId: z.string(),
})

const productUpdateInputSchema = updateProductSchema.extend({
  id: z.string(),
})

const productBulkStatusInputSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.enum(["draft", "active", "archived"]),
})

export const productsRouter = {
  products: {
    list: os
      .route({ method: "GET" })
      .input(productListInputSchema)
      .handler(({ input }) =>
        listProducts({
          limit: input.limit,
          cursor: input.cursor,
          search: input.search,
          categoryIds: input.categoryIds,
          status: input.status,
          priceFilter: input.priceFilter,
          tagIds: input.tagIds,
        }),
      ),

    byId: os
      .route({ method: "GET" })
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const product = await getPublicProductById(input.id)

        if (!product) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: `Product not found: ${input.id}`,
          })
        }

        return product
      }),

    bySlug: os
      .route({ method: "GET" })
      .input(z.object({ slug: z.string().min(1) }))
      .handler(async ({ input }) => {
        const product = await getPublicProductBySlug(input.slug)

        if (!product) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: `Product not found: ${input.slug}`,
          })
        }

        return product
      }),

    popular: os.route({ method: "GET" }).handler(() => getPopularProducts(10)),

    categories: os.route({ method: "GET" }).handler(() => listCategories()),

    tags: os.route({ method: "GET" }).handler(() => listTags()),

    search: os
      .route({ method: "GET" })
      .input(productSearchInputSchema)
      .handler(async ({ input }) => {
        const cacheKey = `search:${input.query.toLowerCase().trim()}:${input.limit ?? 8}`

        const results = await getOrCompute(
          redisCache,
          cacheKey,
          async () => await searchProducts(input.query, input.limit ?? 8),
          60,
        )

        return { results }
      }),

    execute: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .input(productExecuteInputSchema)
      .handler(async ({ context, input }) => {
        const session = context.session
        const { id: productId, inputs } = input

        const product = await getProductById(productId)

        if (!product) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: `Product not found: ${productId}`,
          })
        }

        if (product.status !== "active") {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: `Product not available: ${productId}`,
          })
        }

        if (product.apiKeyId === null) {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: "Product is not configured with an API key",
          })
        }

        const apiKeys = await getApiKeys()
        const selectedKey = apiKeys.find((key) => key.id === product.apiKeyId)

        if (!selectedKey) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: "The API key configured for this product no longer exists",
          })
        }

        if (selectedKey.status !== "active") {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: "The API key configured for this product is inactive",
          })
        }

        const cost = Number(product.costPerRun ?? 0)

        const decryptedKey = decryptApiKey(selectedKey.apiKey).trim()
        if (!decryptedKey) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            status: 500,
            message: "Failed to decrypt API key",
          })
        }

        const productConfig = product.config as { modelEngine: string } | null

        if (productConfig === null) {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: "Product configuration is missing",
          })
        }

        const runId = createCustomId()

        let execResult: {
          output: string
          usage?: {
            promptTokens: number
            completionTokens: number
            totalTokens: number
          }
        }

        try {
          execResult = await executeAIProduct({
            systemRole: product.systemRole ?? "",
            userInstructionTemplate: product.userInstructionTemplate ?? "",
            inputs,
            config: productConfig,
            outputFormat: product.outputFormat ?? "plain",
            apiKey: decryptedKey,
            provider: selectedKey.provider,
          })
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)
          await insertProductRun({
            id: runId,
            productId,
            userId: session.id,
            inputs,
            outputs: { error: errorMessage },
            status: "failed",
            cost: String(cost),
            completedAt: new Date(),
          })
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            status: 500,
            message: `AI execution failed: ${errorMessage}`,
            cause: error,
          })
        }

        const output = execResult.output

        await insertProductRun({
          id: runId,
          productId,
          userId: session.id,
          inputs,
          outputs: { result: output },
          status: "completed",
          cost: String(cost),
          completedAt: new Date(),
        })

        return {
          runId,
          output,
          cost,
        }
      }),

    preview: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(previewInputSchema)
      .handler(async ({ input }) => {
        validateRequiredInputs(input.inputs, input.inputVariable)
        validateSystemRole(input.systemRole)
        validateUserInstructionTemplate(input.userInstructionTemplate)
        validateApiKeyId(input.apiKeyId)

        const apiKeys = await getApiKeys()
        const selectedKey = apiKeys.find((key) => key.id === input.apiKeyId)

        if (!selectedKey) {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: "Selected API key not found",
          })
        }

        if (selectedKey.status !== "active") {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: "Selected API key is inactive",
          })
        }

        const decryptedKey = decryptApiKey(selectedKey.apiKey).trim()
        if (!decryptedKey) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            status: 500,
            message: "Failed to decrypt API key",
          })
        }

        let execResult: {
          output: string
          usage?: {
            promptTokens: number
            completionTokens: number
            totalTokens: number
          }
        }

        try {
          execResult = await executeAIProduct({
            systemRole: input.systemRole,
            userInstructionTemplate: input.userInstructionTemplate,
            inputs: input.inputs,
            config: input.config,
            outputFormat: input.outputFormat,
            apiKey: decryptedKey,
            provider: selectedKey.provider,
          })
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)

          if (
            error instanceof Error &&
            (error.name === "ContextLengthError" ||
              error.name === "InvalidKeyError" ||
              error.name === "RateLimitError")
          ) {
            throw new ORPCError("BAD_REQUEST", {
              status: 400,
              message: `AI execution failed: ${errorMessage}`,
            })
          }

          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            status: 500,
            message: `AI execution failed: ${errorMessage}`,
            cause: error,
          })
        }

        return {
          output: execResult.output,
          cost: 0,
        }
      }),

    adminById: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const product = await getProductById(input.id)

        if (!product) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: `Product not found: ${input.id}`,
          })
        }

        return product
      }),

    create: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(insertProductSchema)
      .handler(async ({ context, input }) => {
        const session = context.session
        const { tagIds, categoryIds, thumbnailId, ...toolData } = input

        if (thumbnailId) {
          const asset = await getAssetById(thumbnailId)
          if (!asset) {
            throw new ORPCError("NOT_FOUND", {
              status: 404,
              message: `Asset not found: ${thumbnailId}`,
            })
          }
          if (asset.type !== "images") {
            throw new ORPCError("BAD_REQUEST", {
              status: 400,
              message: "Thumbnail must be an image asset",
            })
          }
        }

        if (categoryIds && categoryIds.length > 0) {
          const valid = await validateCategoryIds(categoryIds)
          if (!valid) {
            throw new ORPCError("BAD_REQUEST", {
              status: 400,
              message: "One or more category IDs are invalid",
            })
          }
        }

        if (tagIds && tagIds.length > 0) {
          const valid = await validateTagIds(tagIds)
          if (!valid) {
            throw new ORPCError("BAD_REQUEST", {
              status: 400,
              message: "One or more tag IDs are invalid",
            })
          }
        }

        const product = await createProduct({
          ...toolData,
          thumbnailId: thumbnailId ?? undefined,
          categoryIds,
          tagIds,
          createdBy: session.id,
        })

        return product
      }),

    update: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(productUpdateInputSchema)
      .handler(async ({ input }) => {
        const { id, tagIds, categoryIds, thumbnailId, ...data } = input

        if (!id) {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: "Product ID is required",
          })
        }

        if (thumbnailId) {
          const asset = await getAssetById(thumbnailId)
          if (!asset) {
            throw new ORPCError("NOT_FOUND", {
              status: 404,
              message: `Asset not found: ${thumbnailId}`,
            })
          }
          if (asset.type !== "images") {
            throw new ORPCError("BAD_REQUEST", {
              status: 400,
              message: "Thumbnail must be an image asset",
            })
          }
        }

        if (categoryIds && categoryIds.length > 0) {
          const valid = await validateCategoryIds(categoryIds)
          if (!valid) {
            throw new ORPCError("BAD_REQUEST", {
              status: 400,
              message: "One or more category IDs are invalid",
            })
          }
        }

        if (tagIds && tagIds.length > 0) {
          const valid = await validateTagIds(tagIds)
          if (!valid) {
            throw new ORPCError("BAD_REQUEST", {
              status: 400,
              message: "One or more tag IDs are invalid",
            })
          }
        }

        const product = await updateProduct(id, {
          ...data,
          thumbnailId: thumbnailId ?? undefined,
          categoryIds,
          tagIds,
        })

        return product
      }),

    delete: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(z.object({ id: z.string() }))
      .output(z.object({ success: z.boolean() }))
      .handler(async ({ input }) => {
        await deleteProduct(input.id)
        return { success: true }
      }),

    duplicate: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(z.object({ id: z.string() }))
      .handler(async ({ context, input }) => {
        const session = context.session
        const product = await duplicateProduct(input.id, session.id)
        return product
      }),

    bulkStatusUpdate: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(productBulkStatusInputSchema)
      .handler(({ input }) => updateProductStatus(input.ids, input.status)),
  },
}
