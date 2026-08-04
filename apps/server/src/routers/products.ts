import { ORPCError } from "@orpc/server"
import { executeWorkflow } from "server/llm/workflow"
import { z } from "zod"

import { redisCache } from "cache"
import { getOrCompute } from "cache/services/with-cache"
import {
  productWorkflowSchema,
  insertProductSchema,
  updateProductSchema,
  type ProductWorkflow,
} from "db/schema"
import { findAIModelByProviderAndModelId, getSetting } from "db/services/admin"
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
import { type ApiKeyConfig, apiKeyProviderSchema } from "utils/api-input"
import { createCustomId } from "utils/custom-id"

import { os, requireAdminMiddleware, requireAuthMiddleware } from "./orpc"

const API_KEYS_SETTING_KEY = "api_keys"
const SETTINGS_CACHE_TTL = 300

function validateWorkflow(workflow: unknown): void {
  const result = productWorkflowSchema.safeParse(workflow)
  if (!result.success) {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: `Invalid workflow: ${result.error.issues[0]?.message ?? "unknown"}`,
    })
  }
}

function validateWorkflowInputs(
  inputs: Record<string, string>,
  workflow: ProductWorkflow,
): void {
  const inputNodes = workflow.nodes.filter(
    (n): n is Extract<(typeof workflow.nodes)[number], { type: "input" }> =>
      n.type === "input",
  )
  const allFields = inputNodes.flatMap((n) => n.data.fields)
  const missing = allFields
    .filter((f) => !f.isOptional && !inputs[f.variableName])
    .map((f) => f.variableName)

  if (missing.length > 0) {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: `Missing required inputs: ${missing.join(", ")}`,
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

export async function validateModelForKey(
  key: ApiKeyConfig,
  modelEngine: string,
  findModel: (
    provider: string,
    modelId: string,
  ) => Promise<{ isEnabled: boolean } | null> = findAIModelByProviderAndModelId,
): Promise<void> {
  const parsedProvider = apiKeyProviderSchema.safeParse(key.provider)
  if (!parsedProvider.success) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      status: 500,
      message: `API key ${key.id} has invalid provider "${key.provider}"`,
    })
  }

  const model = await findModel(key.provider, modelEngine)

  if (!model) {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: `Model "${modelEngine}" is not configured for provider "${key.provider}"`,
    })
  }

  if (!model.isEnabled) {
    throw new ORPCError("BAD_REQUEST", {
      status: 400,
      message: `Model "${modelEngine}" is disabled`,
    })
  }
}

const productListInputSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
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
  workflow: productWorkflowSchema,
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
      .handler(({ input, context }) => {
        const isAdmin = context.session?.role === "admin"
        return listProducts({
          limit: input.limit,
          offset: input.offset,
          cursor: input.cursor,
          search: input.search,
          categoryIds: input.categoryIds,
          status: isAdmin ? input.status : "active",
          priceFilter: input.priceFilter,
          tagIds: input.tagIds,
        })
      }),

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

        if (!product.workflow) {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: "Product workflow is missing",
          })
        }

        validateWorkflow(product.workflow)
        validateWorkflowInputs(
          inputs as Record<string, string>,
          product.workflow,
        )

        const apiKeys = await getApiKeys()

        const productConfig = product.config as { modelEngine: string } | null
        if (productConfig === null) {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: "Product configuration is missing",
          })
        }

        const runId = createCustomId()
        const cost = Number(product.costPerRun ?? 0)

        try {
          const result = await executeWorkflow({
            workflow: product.workflow,
            inputs,
            productConfig: {
              modelEngine: productConfig.modelEngine,
              outputFormat: product.outputFormat ?? "plain",
            },
            productApiKeyId: product.apiKeyId,
            apiKeys,
          })

          await insertProductRun({
            id: runId,
            productId,
            userId: session.id,
            inputs,
            outputs: {
              finalOutputName: result.finalOutputName,
              finalOutput: result.finalOutput,
              steps: result.steps.map((s) => ({
                nodeId: s.nodeId,
                outputName: s.outputName,
                value: s.value,
                status: s.status,
              })),
            },
            status: "completed",
            cost: String(cost),
            completedAt: new Date(),
          })

          return {
            runId,
            output: result.finalOutput,
            cost,
          }
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
            message: `Workflow execution failed: ${errorMessage}`,
            cause: error,
          })
        }
      }),

    preview: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(previewInputSchema)
      .handler(async ({ input }) => {
        validateWorkflow(input.workflow)
        validateWorkflowInputs(input.inputs, input.workflow)

        const apiKeys = await getApiKeys()

        try {
          const result = await executeWorkflow({
            workflow: input.workflow,
            inputs: input.inputs,
            productConfig: {
              modelEngine: input.config.modelEngine,
              outputFormat: input.outputFormat,
            },
            productApiKeyId: input.apiKeyId,
            apiKeys,
          })

          return {
            output: result.finalOutput,
            steps: result.steps,
            cost: 0,
          }
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
              message: `Workflow execution failed: ${errorMessage}`,
            })
          }

          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            status: 500,
            message: `Workflow execution failed: ${errorMessage}`,
            cause: error,
          })
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
